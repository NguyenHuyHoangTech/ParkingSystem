package com.parking.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    /**
     * Mocks sending an email. In a real environment, this would use JavaMailSender.
     */
    public void sendEmail(String to, String subject, String body) {
        log.info("================ EMAIL MOCK ================");
        log.info("To: {}", to);
        log.info("Subject: {}", subject);
        log.info("Body:\n{}", body);
        log.info("============================================");
    }
}
