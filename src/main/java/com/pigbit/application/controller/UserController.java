package com.pigbit.application.controller;

import com.pigbit.application.dto.UserResponse;
import com.pigbit.application.dto.UserUpdateRequest;
import com.pigbit.core.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Retorna os dados do lojista autenticado.
     * @param userDetails Injetado automaticamente pelo Spring Security a partir do Token
     */
    @GetMapping
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        // userDetails.getUsername() geralmente retorna o email do usuário
        UserResponse response = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Atualiza dados parciais do perfil (trading name, phone, etc).
     */
    @PatchMapping
    public ResponseEntity<UserResponse> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UserUpdateRequest req) {

        UserResponse response = userService.updateProfile(userDetails.getUsername(), req);
        return ResponseEntity.ok(response);
    }
}