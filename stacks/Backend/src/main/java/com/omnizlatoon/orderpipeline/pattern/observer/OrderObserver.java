package com.omnizlatoon.orderpipeline.pattern.observer;

public interface OrderObserver {
    void onOrderCompleted(OrderCompletedEvent event);
}
