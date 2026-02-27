package com.pigbit.core.service;

import com.pigbit.application.dto.WebhookEventResponse;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.persistence.InvoiceRepository;
import com.pigbit.infrastructure.persistence.UserRepository;
import com.pigbit.infrastructure.persistence.WebhookEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class WebhookEventService {
    private final WebhookEventRepository webhookEventRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    public WebhookEventService(
            WebhookEventRepository webhookEventRepository,
            InvoiceRepository invoiceRepository,
            UserRepository userRepository
    ) {
        this.webhookEventRepository = webhookEventRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
    }

    public List<WebhookEventResponse> listByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        List<String> paymentIds = invoiceRepository.findPaymentIdsByUserId(user.getId());
        if (paymentIds.isEmpty()) {
            return Collections.emptyList();
        }
        return webhookEventRepository.findByPaymentIdInOrderByCreatedAtDesc(paymentIds).stream()
                .map(event -> new WebhookEventResponse(
                        event.getPaymentId(),
                        event.isValidSignature(),
                        event.getProcessedAt(),
                        event.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public Page<WebhookEventResponse> listByUserEmail(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        List<String> paymentIds = invoiceRepository.findPaymentIdsByUserId(user.getId());
        if (paymentIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return webhookEventRepository.findByPaymentIdInOrderByCreatedAtDesc(paymentIds, pageable)
                .map(event -> new WebhookEventResponse(
                        event.getPaymentId(),
                        event.isValidSignature(),
                        event.getProcessedAt(),
                        event.getCreatedAt()
                ));
    }
}
