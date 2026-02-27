package com.pigbit.application.controller;

import com.pigbit.application.dto.WalletRequest;
import com.pigbit.application.dto.WalletResponse;
import com.pigbit.core.service.WalletService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wallets")
public class WalletController {
    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping
    public ResponseEntity<WalletResponse> add(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WalletRequest req) {
        WalletResponse response = walletService.add(userDetails.getUsername(), req);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<WalletResponse>> list(@AuthenticationPrincipal UserDetails userDetails) {
        List<WalletResponse> responses = walletService.list(userDetails.getUsername());
        return ResponseEntity.ok(responses);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<WalletResponse> edit(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody WalletRequest req) {
        WalletResponse response = walletService.edit(userDetails.getUsername(), id, req);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content")
    })
    public ResponseEntity<Void> remove(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        walletService.remove(userDetails.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
