package com.pigbit.application.controller;

import com.pigbit.application.dto.ApiKeyCreateRequest;
import com.pigbit.application.dto.ApiKeyResponse;
import com.pigbit.core.service.ApiKeyService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/api-keys")
public class ApiKeyController {
    private final ApiKeyService apiKeyService;

    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @PostMapping
    public ResponseEntity<ApiKeyResponse> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody(required = false) ApiKeyCreateRequest request) {
        ApiKeyResponse response = apiKeyService.create(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> list(@AuthenticationPrincipal UserDetails userDetails) {
        List<ApiKeyResponse> response = apiKeyService.list(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content")
    })
    public ResponseEntity<Void> revoke(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        apiKeyService.revoke(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
