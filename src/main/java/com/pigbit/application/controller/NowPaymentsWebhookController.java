package com.pigbit.application.controller;

import com.pigbit.core.service.NowPaymentsWebhookService;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks/nowpayments")
public class NowPaymentsWebhookController {
    private final NowPaymentsWebhookService webhookService;

    public NowPaymentsWebhookController(NowPaymentsWebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @PostMapping
    @RequestBody(
            required = true,
            content = @Content(schema = @Schema(type = "object"))
    )
    public ResponseEntity<Void> handle(@org.springframework.web.bind.annotation.RequestBody String payload, @RequestHeader(name = "x-nowpayments-sig", required = false) String signature) {
        boolean valid = webhookService.handleWebhook(payload, signature);
        return valid ? ResponseEntity.ok().build() : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
