package com.omnizlatoon.orderpipeline.dto;

import com.omnizlatoon.orderpipeline.entity.OrderItem;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long bookId,
        String title,
        String author,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getBook().getId(),
                item.getBook().getTitle(),
                item.getBook().getAuthor(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal()
        );
    }
}
