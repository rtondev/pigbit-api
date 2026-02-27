package com.pigbit.core.service;

import com.pigbit.application.dto.UserResponse;
import com.pigbit.application.dto.UserUpdateRequest;
import com.pigbit.application.exception.NotFoundException;
import com.pigbit.core.model.User;
import com.pigbit.infrastructure.persistence.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;

    public UserResponse findByEmail(String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return mapToResponse(user);
    }

    public UserResponse updateProfile(String username, UserUpdateRequest req) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

        if (req.tradingName() != null) {
            user.setTradingName(req.tradingName());
        }
        if (req.phone() != null) {
            user.setPhone(req.phone());
        }

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getTaxId(),
                user.getTradingName(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }
}
