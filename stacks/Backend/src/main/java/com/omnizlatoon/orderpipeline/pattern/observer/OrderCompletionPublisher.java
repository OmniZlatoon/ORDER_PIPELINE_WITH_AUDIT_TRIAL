package com.omnizlatoon.orderpipeline.pattern.observer;

import com.omnizlatoon.orderpipeline.entity.Order;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class OrderCompletionPublisher {
    private final ApplicationEventPublisher eventPublisher;

    public OrderCompletionPublisher(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void publish(Order order) {
        eventPublisher.publishEvent(new OrderCompletedEvent(order.getId()));
    }
}
