package com.omnizlatoon.orderpipeline.service;

public class OrderNotFoundException extends RuntimeException {
    public OrderNotFoundException(Long orderId) {
        super("Order " + orderId + " was not found");
    }

    public OrderNotFoundException(String orderReference) {
        super("Order reference " + orderReference + " was not found");
    }
}
