package com.pigbit.infrastructure.integration;

import com.pigbit.application.dto.CnpjCompanyInfo;
import com.pigbit.application.exception.BadRequestException;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.application.exception.ApiException;
import com.pigbit.infrastructure.redis.RedisService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class HttpCnpjLookupService implements CnpjLookupService {
    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final RedisService redisService;

    public HttpCnpjLookupService(
            @Value("${cnpj.api.base-url:}") String baseUrl,
            RedisService redisService
    ) {
        this.restTemplate = new RestTemplate();
        this.baseUrl = baseUrl;
        this.redisService = redisService;
    }

    @Override
    public CnpjCompanyInfo lookup(String taxId) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Servico de CNPJ nao configurado");
        }
        String normalized = normalizeTaxId(taxId);
        if (!isValidCnpj(normalized)) {
            throw new BadRequestException("CNPJ invalido");
        }
        if (redisService.isAvailable()) {
            var cached = redisService.getJson(cnpjKey(normalized), CnpjCompanyInfo.class);
            if (cached.isPresent()) {
                return cached.get();
            }
        }
        String url = baseUrl.endsWith("/") ? baseUrl + normalized : baseUrl + "/" + normalized;
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();
        if (body == null) {
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY, "Resposta CNPJ invalida");
        }

        String status = asString(body, "status");
        if (!"OK".equalsIgnoreCase(status)) {
            String message = asString(body, "message");
            throw new NotFoundException(message == null ? "CNPJ nao encontrado" : message);
        }

        String legalName = asString(body, "nome");
        String tradingName = asString(body, "fantasia");
        String registrationStatus = asString(body, "situacao");
        String cnae = extractCnae(body);

        String address = buildAddress(body);
        CnpjCompanyInfo info = new CnpjCompanyInfo(normalized, legalName, tradingName, address, cnae, registrationStatus);
        if (redisService.isAvailable()) {
            redisService.setJson(cnpjKey(normalized), info, Duration.ofHours(12));
        }
        return info;
    }

    private String buildAddress(Map<String, Object> body) {
        String logradouro = asString(body, "logradouro");
        String numero = asString(body, "numero");
        String complemento = asString(body, "complemento");
        String municipio = asString(body, "municipio");
        String uf = asString(body, "uf");
        String bairro = asString(body, "bairro");
        StringBuilder builder = new StringBuilder();
        appendPart(builder, logradouro);
        appendPart(builder, numero);
        appendPart(builder, complemento);
        appendPart(builder, bairro);
        appendPart(builder, municipio);
        appendPart(builder, uf);
        String address = builder.toString().trim();
        return address.isEmpty() ? null : address;
    }

    private void appendPart(StringBuilder builder, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (builder.length() > 0) {
            builder.append(", ");
        }
        builder.append(value.trim());
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

    private String extractCnae(Map<String, Object> body) {
        Object raw = body.get("atividade_principal");
        if (raw instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> map) {
            Object code = map.get("code");
            return code == null ? null : code.toString();
        }
        return null;
    }

    private String normalizeTaxId(String taxId) {
        return taxId == null ? null : taxId.replaceAll("\\D", "");
    }

    private boolean isValidCnpj(String cnpj) {
        if (cnpj == null || !cnpj.matches("\\d{14}")) {
            return false;
        }
        if (cnpj.chars().distinct().count() == 1) {
            return false;
        }
        int[] weight1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] weight2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int d1 = calculateDigit(cnpj, weight1);
        int d2 = calculateDigit(cnpj, weight2);
        return cnpj.charAt(12) == (char) ('0' + d1) && cnpj.charAt(13) == (char) ('0' + d2);
    }

    private int calculateDigit(String cnpj, int[] weights) {
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += Character.getNumericValue(cnpj.charAt(i)) * weights[i];
        }
        int mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    }

    private String cnpjKey(String normalized) {
        return "cnpj:" + normalized;
    }
}
