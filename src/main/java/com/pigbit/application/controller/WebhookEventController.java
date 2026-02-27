package com.pigbit.application.controller;

import com.pigbit.application.dto.WebhookEventResponse;
import com.pigbit.core.service.WebhookEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;


@RestController
@RequestMapping("/api/v1/webhook-events")
public class WebhookEventController {
    private final WebhookEventService webhookEventService;

    public WebhookEventController(WebhookEventService webhookEventService) {
        this.webhookEventService = webhookEventService;
    }

    @GetMapping
    public ResponseEntity<Page<WebhookEventResponse>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @ParameterObject Pageable pageable) {
        Page<WebhookEventResponse> response = webhookEventService.listByUserEmail(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(response);
    }
}
