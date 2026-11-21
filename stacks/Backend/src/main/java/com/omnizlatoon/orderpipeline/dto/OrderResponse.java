package com.omnizlatoon.orderpipeline.dto;

import com.omnizlatoon.orderpipeline.entity.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long orderId,
        String orderReference,
        String customerName,
        String orderStatus,
        String paymentStatus,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        String paymentLink,
        Long paymentAmountXaf,
        BigDecimal exchangeRateUsdXaf,
        String paymentMessage,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getOrderReference(),
                order.getCustomer().getFullName(),
                order.getOrderStatus().name(),
                order.getPaymentStatus().name(),
                order.getTotalAmount(),
                order.getCreatedAt(),
                order.getCompletedAt(),
                order.getPaymentLink(),
                order.getPaymentAmountXaf(),
                order.getExchangeRateUsdXaf(),
                order.getPaymentAuditMessage(),
                order.getItems().stream().map(OrderItemResponse::from).toList()
        );
    }
}
