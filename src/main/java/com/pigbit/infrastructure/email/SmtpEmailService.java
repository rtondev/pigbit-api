package com.pigbit.infrastructure.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class SmtpEmailService implements EmailService {
    private static final Logger logger = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;
    private final Environment environment;
    private final String from;

    public SmtpEmailService(
            JavaMailSender mailSender,
            Environment environment,
            @Value("${app.mail.from}") String from
    ) {
        this.mailSender = mailSender;
        this.environment = environment;
        this.from = from;
    }

    @Override
    public void send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        if (environment.acceptsProfiles("dev")) {
            logger.info("DEV email to={} subject={} body={}", to, subject, body);
        }

        mailSender.send(message);
    }
}
