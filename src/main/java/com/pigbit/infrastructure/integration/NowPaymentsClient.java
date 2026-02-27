package com.pigbit.infrastructure.integration;

import com.pigbit.application.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class NowPaymentsClient {
    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;

    public NowPaymentsClient(
            @Value("${nowpayments.base-url:}") String baseUrl,
            @Value("${nowpayments.api-key:}") String apiKey
    ) {
        this.restTemplate = new RestTemplate(); // sem builder
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    public Map<String, Object> createInvoice(BigDecimal amountBrl, String payCurrency, String orderId) {
        if (baseUrl == null || baseUrl.isBlank() || apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "NOWPayments nao configurado");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("price_amount", amountBrl);
        payload.put("price_currency", "BRL");
        payload.put("pay_currency", payCurrency);
        payload.put("order_id", orderId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/v1/payment", entity, Map.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha ao criar invoice NOWPayments");
        }
        return response.getBody();
    }

    public void cancelPayment(String paymentId) {
        if (baseUrl == null || baseUrl.isBlank() || apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "NOWPayments nao configurado");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        Map<String, Object> payload = new HashMap<>();
        payload.put("payment_id", paymentId);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/v1/payment/cancel", entity, Map.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Falha ao cancelar invoice NOWPayments");
        }
    }
}
