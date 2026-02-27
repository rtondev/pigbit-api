package com.pigbit.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pigbit.core.model.Invoice;
import com.pigbit.core.model.Transaction;
import com.pigbit.core.model.WebhookEvent;
import com.pigbit.infrastructure.persistence.InvoiceRepository;
import com.pigbit.infrastructure.persistence.TransactionRepository;
import com.pigbit.infrastructure.persistence.WebhookEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NowPaymentsWebhookServiceTest {

    @Mock
    private WebhookEventRepository webhookEventRepository;
    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private TransactionRepository transactionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private NowPaymentsWebhookService webhookService;

    @Test
    void handleWebhook_invalidSignature_returnsFalse() {
        ReflectionTestUtils.setField(webhookService, "ipnSecret", "secret");
        String payload = "{\"payment_id\":\"pid\"}";

        boolean result = webhookService.handleWebhook(payload, "bad");

        assertFalse(result);
        ArgumentCaptor<WebhookEvent> captor = ArgumentCaptor.forClass(WebhookEvent.class);
        verify(webhookEventRepository).save(captor.capture());
        assertFalse(captor.getValue().isValidSignature());
    }

    @Test
    void handleWebhook_validSignature_updatesInvoiceAndTransaction() throws Exception {
        ReflectionTestUtils.setField(webhookService, "ipnSecret", "secret");
        ReflectionTestUtils.setField(webhookService, "objectMapper", objectMapper);

        String payload = "{\"payment_id\":\"pid\",\"payment_status\":\"confirmed\",\"pay_amount\":\"1.23\",\"price_amount\":\"10.00\",\"pay_address\":\"addr\",\"pay_currency\":\"btc\",\"transaction_hash\":\"tx\"}";
        String signature = hmacSha512(payload, "secret");

        Invoice invoice = Invoice.builder().id(1L).paymentId("pid").status("waiting").build();
        when(invoiceRepository.findByPaymentId("pid")).thenReturn(Optional.of(invoice));
        when(transactionRepository.findByInvoiceId(1L)).thenReturn(Optional.empty());

        boolean result = webhookService.handleWebhook(payload, signature);

        assertTrue(result);
        verify(invoiceRepository).save(any(Invoice.class));
        verify(transactionRepository).save(any(Transaction.class));
    }

    private String hmacSha512(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder builder = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            builder.append(String.format("%02x", b));
        }
        return builder.toString();
    }
}
