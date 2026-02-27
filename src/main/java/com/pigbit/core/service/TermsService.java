package com.pigbit.core.service;

import com.pigbit.application.dto.TermsHistory;
import com.pigbit.application.dto.TermsRequest;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.core.model.TermsAcceptance;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.persistence.TermsAcceptanceRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TermsService {
    private final TermsAcceptanceRepository termsAcceptanceRepository;
    private final UserRepository userRepository;

    public TermsService(TermsAcceptanceRepository termsAcceptanceRepository, UserRepository userRepository) {
        this.termsAcceptanceRepository = termsAcceptanceRepository;
        this.userRepository = userRepository;
    }

    public void accept(String userEmail, TermsRequest request, String ipAddress) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        TermsAcceptance acceptance = TermsAcceptance.builder()
                .user(user)
                .documentType(request.documentType())
                .version(request.version())
                .ipAddress(ipAddress)
                .build();
        termsAcceptanceRepository.save(acceptance);
    }

    public List<TermsHistory> history(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return termsAcceptanceRepository.findByUserIdOrderByAcceptedAtDesc(user.getId()).stream()
                .map(this::mapToHistory)
                .collect(Collectors.toList());
    }

    private TermsHistory mapToHistory(TermsAcceptance acceptance) {
        return new TermsHistory(
                acceptance.getDocumentType(),
                acceptance.getVersion(),
                acceptance.getIpAddress(),
                acceptance.getAcceptedAt()
        );
    }
}
