package com.pigbit.application.controller;

import com.pigbit.application.dto.TermsHistory;
import com.pigbit.application.dto.TermsRequest;
import com.pigbit.core.service.TermsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/terms")
public class TermsController {
    private final TermsService termsService;

    public TermsController(TermsService termsService) {
        this.termsService = termsService;
    }

    @PostMapping("/accept")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content"),
            @ApiResponse(responseCode = "400", description = "Bad Request")
    })
    public ResponseEntity<Void> accept(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TermsRequest req,
            HttpServletRequest httpRequest) {
        termsService.accept(userDetails.getUsername(), req, getClientIp(httpRequest));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/history")
    public ResponseEntity<List<TermsHistory>> history(@AuthenticationPrincipal UserDetails userDetails) {
        List<TermsHistory> response = termsService.history(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
