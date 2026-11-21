package com.omnizlatoon.orderpipeline.controller;

import com.omnizlatoon.orderpipeline.dto.FapshiWebhookRequest;
import com.omnizlatoon.orderpipeline.service.FapshiWebhookService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
public class FapshiWebhookController {
    private final FapshiWebhookService webhookService;
    private final String webhookSecret;

    public FapshiWebhookController(
            FapshiWebhookService webhookService,
            @Value("${app.fapshi.webhook-secret:}") String webhookSecret
    ) {
        this.webhookService = webhookService;
        this.webhookSecret = webhookSecret;
    }

    @PostMapping("/fapshi_demo/webhook")
    public ResponseEntity<Void> receive(
            @RequestHeader(name = "x-wh-secret", required = false) String providedSecret,
            @RequestBody(required = false) FapshiWebhookRequest request
    ) {
        if (webhookSecret.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Fapshi webhook secret is not configured.");
        }
        if (providedSecret == null || !MessageDigest.isEqual(
                webhookSecret.getBytes(StandardCharsets.UTF_8),
                providedSecret.getBytes(StandardCharsets.UTF_8)
        )) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid webhook secret.");
        }
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webhook payload is required.");
        }

        webhookService.process(request);
        return ResponseEntity.ok().build();
    }
}
