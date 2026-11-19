package com.omnizlatoon.orderpipeline.pattern.observer;

import com.omnizlatoon.orderpipeline.entity.NotificationType;
import com.omnizlatoon.orderpipeline.service.NotificationService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class EmailObserver implements OrderObserver {
    private final NotificationService notificationService;

    public EmailObserver(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCompleted(OrderCompletedEvent event) {
        notificationService.recordIfAbsent(
                event.orderId(),
                NotificationType.EMAIL,
                "Simulated order confirmation email prepared"
        );
    }
}
