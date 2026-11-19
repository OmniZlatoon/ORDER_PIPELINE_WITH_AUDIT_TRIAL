package com.omnizlatoon.orderpipeline.repository;

import com.omnizlatoon.orderpipeline.entity.Notification;
import com.omnizlatoon.orderpipeline.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByOrder_IdOrderByCreatedAtAscIdAsc(Long orderId);

    Optional<Notification> findByOrder_IdAndNotificationType(Long orderId, NotificationType notificationType);
}
