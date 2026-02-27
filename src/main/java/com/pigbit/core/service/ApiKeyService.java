package com.pigbit.core.service;

import com.pigbit.application.dto.ApiKeyCreateRequest;
import com.pigbit.application.dto.ApiKeyResponse;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.application.exception.BadRequestException;
import com.pigbit.core.model.ApiKey;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.persistence.ApiKeyRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ApiKeyService {
    private static final int KEY_BYTES = 32;

    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ApiKeyService(ApiKeyRepository apiKeyRepository, UserRepository userRepository) {
        this.apiKeyRepository = apiKeyRepository;
        this.userRepository = userRepository;
    }

    public ApiKeyResponse create(String userEmail, ApiKeyCreateRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        String rawKey = generateRawKey();
        String prefix = rawKey.substring(0, 8);
        String hash = hashKey(rawKey);

        ApiKey apiKey = ApiKey.builder()
                .user(user)
                .name(request == null ? null : request.name())
                .keyPrefix(prefix)
                .keyHash(hash)
                .build();

        ApiKey saved = apiKeyRepository.save(apiKey);
        return new ApiKeyResponse(saved.getId(), saved.getName(), saved.getKeyPrefix(), rawKey, saved.getCreatedAt(), saved.getRevokedAt());
    }

    public List<ApiKeyResponse> list(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return apiKeyRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void revoke(String userEmail, Long id) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        ApiKey apiKey = apiKeyRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new NotFoundException("API Key não encontrada"));
        apiKey.setRevokedAt(LocalDateTime.now());
        apiKeyRepository.save(apiKey);
    }

    private ApiKeyResponse mapToResponse(ApiKey key) {
        return new ApiKeyResponse(key.getId(), key.getName(), key.getKeyPrefix(), null, key.getCreatedAt(), key.getRevokedAt());
    }

    private String generateRawKey() {
        byte[] bytes = new byte[KEY_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
        } catch (Exception ex) {
            throw new BadRequestException("Falha ao gerar hash da API key");
        }
    }
}
