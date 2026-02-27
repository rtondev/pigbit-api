package com.pigbit.application.controller;

import com.pigbit.application.dto.InvoiceCheckoutResponse;
import com.pigbit.application.dto.InvoiceRequest;
import com.pigbit.application.dto.InvoiceResponse;
import com.pigbit.core.service.InvoiceService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springdoc.core.annotations.ParameterObject;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    public ResponseEntity<InvoiceResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody InvoiceRequest req) {
        InvoiceResponse response = invoiceService.createInvoice(req, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceResponse>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @ParameterObject Pageable pageable) {
        Page<InvoiceResponse> response = invoiceService.listByUser(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> get(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        InvoiceResponse response = invoiceService.getById(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/checkout/{paymentId}") // Endpoint Público
    public ResponseEntity<InvoiceCheckoutResponse> getCheckout(@PathVariable String paymentId) {
        InvoiceCheckoutResponse response = invoiceService.getCheckout(paymentId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content"),
            @ApiResponse(responseCode = "409", description = "Conflict")
    })
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        invoiceService.cancel(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
