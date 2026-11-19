package com.omnizlatoon.orderpipeline.service;

import com.omnizlatoon.orderpipeline.entity.Notification;
import com.omnizlatoon.orderpipeline.entity.NotificationStatus;
import com.omnizlatoon.orderpipeline.entity.NotificationType;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.repository.NotificationRepository;
import com.omnizlatoon.orderpipeline.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final OrderRepository orderRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            OrderRepository orderRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordIfAbsent(Long orderId, NotificationType type, String message) {
        if (notificationRepository.findByOrder_IdAndNotificationType(orderId, type).isPresent()) {
            return;
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        LocalDateTime now = LocalDateTime.now();
        notificationRepository.save(new Notification(
                order,
                type,
                NotificationStatus.SENT,
                message,
                now
        ));
    }
}
