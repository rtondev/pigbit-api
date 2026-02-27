package com.pigbit.core.service;

import com.pigbit.application.dto.InvoiceRequest;
import com.pigbit.application.dto.InvoiceResponse;
import com.pigbit.application.dto.InvoiceCheckoutResponse;
import com.pigbit.core.model.Invoice;
import com.pigbit.core.model.Product;
import com.pigbit.infrastructure.integration.NowPaymentsClient;
import com.pigbit.infrastructure.persistence.InvoiceRepository;
import com.pigbit.infrastructure.persistence.ProductRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NowPaymentsClient nowPaymentsClient;

    public InvoiceResponse createInvoice(InvoiceRequest request, String userEmail) {

        // 1. Validação de Preço (Anti-Fraude)
        BigDecimal finalAmount = request.amountBrl();
        if (request.productId() != null) {
            finalAmount = productRepository.findById(request.productId())
                    .map(Product::getPriceBrl)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
        }

        Product product = null;
        if (request.productId() != null) {
            product = productRepository.getReferenceById(request.productId());
        }

        Long userId = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"))
                .getId();

        // 2. Criação da Entidade com o Relacionamento Correto
        String orderId = UUID.randomUUID().toString();
        Map<String, Object> nowResponse = nowPaymentsClient.createInvoice(finalAmount, request.cryptoCurrency(), orderId);

        String paymentId = asString(nowResponse, "payment_id");
        String payAddress = asString(nowResponse, "pay_address");
        BigDecimal amountCrypto = asBigDecimal(nowResponse, "pay_amount");
        String status = asString(nowResponse, "payment_status");
        LocalDateTime expiresAt = asDateTime(nowResponse, "expiration_estimate_date");
        if (expiresAt == null) {
            expiresAt = LocalDateTime.now().plusMinutes(15);
        }

        Invoice invoice = Invoice.builder()
                .user(userRepository.getReferenceById(userId)) // Vincula o User corretamente
                .product(product)
                .amountBrl(finalAmount)
                .amountCrypto(amountCrypto)
                .cryptoCurrency(request.cryptoCurrency())
                .status(status == null ? "waiting" : status)
                .paymentId(paymentId == null ? orderId : paymentId)
                .payAddress(payAddress)
                .expiresAt(expiresAt)
                .build();

        return mapToResponse(invoiceRepository.save(invoice));
    }

    private InvoiceResponse mapToResponse(Invoice i) {
        // Note: amountCrypto e payAddress virão nulos até você integrar com a NOWPayments
        return new InvoiceResponse(
                i.getId(),
                i.getPaymentId(),
                i.getAmountBrl(),
                i.getAmountCrypto(),
                i.getCryptoCurrency(),
                i.getStatus(),
                i.getPayAddress(),
                i.getExpiresAt()
        );
    }

    public Page<InvoiceResponse> listByUser(String userEmail, Pageable pageable) {
        Long userId = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"))
                .getId();
        return invoiceRepository.findByUserId(userId, pageable).map(this::mapToResponse);
    }

    public InvoiceResponse getById(String userEmail, Long id) {
        Long userId = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"))
                .getId();
        Invoice invoice = invoiceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice não encontrada"));
        return mapToResponse(invoice);
    }

    public void cancel(String userEmail, Long id) {
        Long userId = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"))
                .getId();
        Invoice invoice = invoiceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice não encontrada"));
        if ("confirmed".equalsIgnoreCase(invoice.getStatus()) || "finished".equalsIgnoreCase(invoice.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice não pode ser cancelada");
        }
        nowPaymentsClient.cancelPayment(invoice.getPaymentId());
        invoice.setStatus("expired");
        invoiceRepository.save(invoice);
    }

    public InvoiceCheckoutResponse getCheckout(String paymentId) {
        Invoice invoice = invoiceRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice não encontrada"));

        if (invoice.getExpiresAt() != null && invoice.getExpiresAt().isBefore(LocalDateTime.now())
                && !"finished".equalsIgnoreCase(invoice.getStatus())
                && !"confirmed".equalsIgnoreCase(invoice.getStatus())) {
            invoice.setStatus("expired");
            invoiceRepository.save(invoice);
        }

        long timeoutSeconds = 0;
        if (invoice.getExpiresAt() != null) {
            timeoutSeconds = Math.max(0, invoice.getExpiresAt().toEpochSecond(ZoneOffset.UTC)
                    - LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));
        }

        String qrData = buildQrData(invoice);
        return new InvoiceCheckoutResponse(
                invoice.getPaymentId(),
                invoice.getAmountBrl(),
                invoice.getAmountCrypto(),
                invoice.getCryptoCurrency(),
                invoice.getPayAddress(),
                timeoutSeconds,
                invoice.getStatus(),
                qrData
        );
    }

    private String buildQrData(Invoice invoice) {
        if (invoice.getPayAddress() == null || invoice.getAmountCrypto() == null || invoice.getCryptoCurrency() == null) {
            return null;
        }
        return invoice.getCryptoCurrency() + ":" + invoice.getPayAddress()
                + "?amount=" + invoice.getAmountCrypto()
                + "&payment_id=" + invoice.getPaymentId();
    }

    private String asString(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
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

    private LocalDateTime asDateTime(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.toString().replace("Z", ""));
        } catch (Exception ex) {
            return null;
        }
    }
}
