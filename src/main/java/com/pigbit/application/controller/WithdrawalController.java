package com.pigbit.application.controller;

import com.pigbit.application.dto.WithdrawalRequest;
import com.pigbit.application.dto.WithdrawalResponse;
import com.pigbit.core.service.WithdrawalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;


@RestController
@RequestMapping("/api/v1/withdrawals")
public class WithdrawalController {
    private final WithdrawalService withdrawalService;

    public WithdrawalController(WithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    @PostMapping
    public ResponseEntity<WithdrawalResponse> request(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WithdrawalRequest req,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        WithdrawalResponse response = withdrawalService.requestWithdrawal(
                req,
                userDetails.getUsername(),
                getClientIp(httpRequest),
                httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<WithdrawalResponse>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @ParameterObject Pageable pageable) {
        Page<WithdrawalResponse> responses = withdrawalService.list(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WithdrawalResponse> get(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        WithdrawalResponse response = withdrawalService.getById(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }

    private String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
