package com.pigbit.infrastructure.email;

public interface EmailService {
    void send(String to, String subject, String body);
}
