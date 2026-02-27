package com.pigbit.application.controller;

import com.pigbit.application.dto.*;
import com.pigbit.core.service.AuthService;
import com.pigbit.core.service.TwoFactorAuthService;
import com.pigbit.core.service.VerificationService;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TwoFactorAuthService tfaService;
    private final VerificationService verificationService;

    @PostMapping("/register")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created"),
            @ApiResponse(responseCode = "400", description = "Bad Request")
    })
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody UserRegistrationRequest request,
            HttpServletRequest httpRequest) {
        RegisterResponse response = authService.register(request, getClientIp(httpRequest), getUserAgent(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/confirm")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created"),
            @ApiResponse(responseCode = "400", description = "Bad Request")
    })
    public ResponseEntity<UserResponse> confirmRegister(
            @Valid @RequestBody RegisterConfirmRequest request,
            HttpServletRequest httpRequest) {
        UserResponse response = authService.confirmRegistration(request, getClientIp(httpRequest), getUserAgent(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(req, getClientIp(httpRequest), getUserAgent(httpRequest));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/2fa")
    public ResponseEntity<AuthResponse> login2fa(
            @Valid @RequestBody LoginTwoFactorRequest req,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.loginWith2fa(req, getClientIp(httpRequest), getUserAgent(httpRequest));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/password-reset/request")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Accepted")
    })
    public ResponseEntity<Void> requestReset(@Valid @RequestBody PasswordResetRequest req) {
        verificationService.createPasswordResetCode(req.taxId());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/password-reset/confirm")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content"),
            @ApiResponse(responseCode = "400", description = "Bad Request")
    })
    public ResponseEntity<Void> confirmReset(@Valid @RequestBody PasswordResetConfirmRequest req) {
        authService.confirmPasswordReset(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email-verify/send")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Accepted")
    })
    public ResponseEntity<Void> sendVerification() {
        // Assume que o usuário está autenticado e pegamos o ID do contexto de segurança
        verificationService.sendEmailVerification();
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/email-verify/validate")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content"),
            @ApiResponse(responseCode = "400", description = "Bad Request")
    })
    public ResponseEntity<Void> validateEmail(@Valid @RequestBody CodeRequest req) {
        verificationService.validateEmailCode(req.code());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/2fa/enable")
    public ResponseEntity<TwoFactorSecretResponse> enable2fa(@AuthenticationPrincipal UserDetails userDetails) {
        TwoFactorSecretResponse response = tfaService.generateQrCode(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/2fa/verify-enable")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content"),
            @ApiResponse(responseCode = "400", description = "Bad Request")
    })
    public ResponseEntity<Void> verifyEnable2fa(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CodeRequest req) {
        tfaService.enable2fa(userDetails.getUsername(), req.code());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/2fa/disable")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "No Content")
    })
    public ResponseEntity<Void> disable2fa(@AuthenticationPrincipal UserDetails userDetails) {
        tfaService.disable2fa(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
