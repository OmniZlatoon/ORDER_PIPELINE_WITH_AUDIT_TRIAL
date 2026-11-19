package com.omnizlatoon.orderpipeline.dto;

import com.omnizlatoon.orderpipeline.entity.Notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long notificationId,
        String notificationType,
        String status,
        String message,
        int attempts,
        LocalDateTime createdAt,
        LocalDateTime sentAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getNotificationType().name(),
                notification.getStatus().name(),
                notification.getMessage(),
                notification.getAttempts(),
                notification.getCreatedAt(),
                notification.getSentAt()
        );
    }
}
