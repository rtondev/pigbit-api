package com.pigbit.core.service;

import com.pigbit.core.model.AuditLog;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.persistence.AuditLogRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import com.pigbit.application.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.pigbit.application.dto.AuditLogResponse;

@Service
@Transactional
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    public void logByEmail(String email, String action, String ip, String userAgent, Map<String, Object> metadata) {
        if (email == null) {
            return;
        }
        userRepository.findByEmail(email).ifPresent(user -> log(user, action, ip, userAgent, metadata));
    }

    public void log(User user, String action, String ip, String userAgent, Map<String, Object> metadata) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .ipAddress(ip)
                .userAgent(userAgent)
                .metadata(metadata)
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLogResponse> listByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(log -> new AuditLogResponse(
                        log.getAction(),
                        log.getIpAddress(),
                        log.getUserAgent(),
                        log.getMetadata(),
                        log.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public Page<AuditLogResponse> listByUserEmail(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(log -> new AuditLogResponse(
                        log.getAction(),
                        log.getIpAddress(),
                        log.getUserAgent(),
                        log.getMetadata(),
                        log.getCreatedAt()
                ));
    }
}
