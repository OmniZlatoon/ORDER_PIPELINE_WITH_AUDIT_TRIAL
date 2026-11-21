package com.omnizlatoon.orderpipeline.dto;

public record FapshiWebhookRequest(
        String transId,
        String status,
        Long amount,
        String externalId
) {
}
