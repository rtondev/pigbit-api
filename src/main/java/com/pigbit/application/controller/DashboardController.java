package com.pigbit.application.controller;

import com.pigbit.application.dto.DashboardMetrics;
import com.pigbit.application.dto.TransactionResponse;
import com.pigbit.core.service.DashboardService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetrics> getMetrics(@AuthenticationPrincipal UserDetails userDetails) {
        DashboardMetrics response = dashboardService.getMetrics(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions")
    public ResponseEntity<Page<TransactionResponse>> listTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            @ParameterObject Pageable pageable) {
        Page<TransactionResponse> response = dashboardService.listTransactions(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions/{id}")
    public ResponseEntity<TransactionResponse> getTransaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        TransactionResponse response = dashboardService.getTransaction(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }
}
