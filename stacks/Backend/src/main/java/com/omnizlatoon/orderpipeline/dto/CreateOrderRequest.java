package com.omnizlatoon.orderpipeline.dto;

import java.util.List;

public record CreateOrderRequest(CustomerRequest customer, List<OrderItemRequest> items) {
}
