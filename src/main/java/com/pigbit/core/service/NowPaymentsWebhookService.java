package com.pigbit.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pigbit.application.exception.ApiException;
import com.pigbit.application.exception.BadRequestException;
import com.pigbit.core.model.Invoice;
import com.pigbit.core.model.Transaction;
import com.pigbit.core.model.WebhookEvent;
import com.pigbit.infrastructure.persistence.InvoiceRepository;
import com.pigbit.infrastructure.persistence.TransactionRepository;
import com.pigbit.infrastructure.persistence.WebhookEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional
public class NowPaymentsWebhookService {
    private final WebhookEventRepository webhookEventRepository;
    private final InvoiceRepository invoiceRepository;
    private final TransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;
    private final String ipnSecret;

    public NowPaymentsWebhookService(
            WebhookEventRepository webhookEventRepository,
            InvoiceRepository invoiceRepository,
            TransactionRepository transactionRepository,
            ObjectMapper objectMapper,
            @Value("${nowpayments.ipn-secret:}") String ipnSecret
    ) {
        this.webhookEventRepository = webhookEventRepository;
        this.invoiceRepository = invoiceRepository;
        this.transactionRepository = transactionRepository;
        this.objectMapper = objectMapper;
        this.ipnSecret = ipnSecret;
    }

    public boolean handleWebhook(String payload, String signature) {
        boolean valid = isValidSignature(payload, signature);
        WebhookEvent event = WebhookEvent.builder()
                .payloadRaw(payload)
                .isValidSignature(valid)
                .build();

        if (!valid) {
            webhookEventRepository.save(event);
            return false;
        }

        Map<String, Object> body = parseJson(payload);
        String paymentId = asString(body, "payment_id");
        event.setPaymentId(paymentId);
        event.setProcessedAt(LocalDateTime.now());
        webhookEventRepository.save(event);

        if (paymentId == null) {
            return true;
        }

        invoiceRepository.findByPaymentId(paymentId).ifPresent(invoice -> {
            String status = normalizeStatus(asString(body, "payment_status"));
            updateInvoiceFromWebhook(invoice, body, status);
            upsertTransaction(invoice, body, status);
            invoiceRepository.save(invoice);
        });

        return true;
    }

    private boolean isValidSignature(String payload, String signature) {
        if (ipnSecret == null || ipnSecret.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "NOWPayments IPN secret nao configurado");
        }
        if (signature == null || signature.isBlank()) {
            return false;
        }
        String computed = hmacSha512(payload, ipnSecret);
        return computed.equalsIgnoreCase(signature);
    }

    private String hmacSha512(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Falha ao validar assinatura NOWPayments");
        }
    }

    private Map<String, Object> parseJson(String payload) {
        try {
            return objectMapper.readValue(payload, Map.class);
        } catch (Exception ex) {
            throw new BadRequestException("Payload NOWPayments invalido");
        }
    }

    private void updateInvoiceFromWebhook(Invoice invoice, Map<String, Object> body, String status) {
        invoice.setStatus(status);
        if (invoice.getAmountCrypto() == null) {
            invoice.setAmountCrypto(asBigDecimal(body, "pay_amount"));
        }
        if (invoice.getPayAddress() == null) {
            invoice.setPayAddress(asString(body, "pay_address"));
        }
        if (invoice.getCryptoCurrency() == null) {
            invoice.setCryptoCurrency(asString(body, "pay_currency"));
        }
        if (invoice.getExchangeRate() == null) {
            invoice.setExchangeRate(asBigDecimal(body, "exchange_rate"));
        }
        if (invoice.getGatewayFee() == null) {
            invoice.setGatewayFee(asBigDecimal(body, "fee"));
        }
    }

    private void upsertTransaction(Invoice invoice, Map<String, Object> body, String status) {
        Transaction transaction = transactionRepository.findByInvoiceId(invoice.getId())
                .orElseGet(() -> Transaction.builder().invoice(invoice).build());
        transaction.setStatus(status);
        if (transaction.getTxHash() == null) {
            transaction.setTxHash(asString(body, "transaction_hash", "txid"));
        }
        if (transaction.getExplorerLink() == null) {
            transaction.setExplorerLink(asString(body, "explorer_link"));
        }
        if (transaction.getAmountCrypto() == null) {
            transaction.setAmountCrypto(asBigDecimal(body, "pay_amount"));
        }
        if (transaction.getAmountBrl() == null) {
            transaction.setAmountBrl(asBigDecimal(body, "price_amount"));
        }
        if (isFinalStatus(status)) {
            transaction.setConfirmedAt(LocalDateTime.now());
        }
        transactionRepository.save(transaction);
    }

    private boolean isFinalStatus(String status) {
        return "confirmed".equals(status) || "finished".equals(status);
    }

    private String normalizeStatus(String status) {
        if (status == null) {
            return "waiting";
        }
        String normalized = status.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "waiting", "confirming", "confirmed", "finished", "expired", "failed" -> normalized;
            default -> "waiting";
        };
    }

    private String asString(Map<String, Object> body, String... keys) {
        for (String key : keys) {
            Object value = body.get(key);
            if (value != null) {
                return value.toString();
            }
        }
        return null;
    }

    private BigDecimal asBigDecimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
