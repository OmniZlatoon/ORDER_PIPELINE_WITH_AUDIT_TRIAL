package com.omnizlatoon.orderpipeline.controller;

import com.omnizlatoon.orderpipeline.dto.AuditEventResponse;
import com.omnizlatoon.orderpipeline.dto.CreateOrderRequest;
import com.omnizlatoon.orderpipeline.dto.NotificationResponse;
import com.omnizlatoon.orderpipeline.dto.OrderResponse;
import com.omnizlatoon.orderpipeline.service.FapshiWebhookService;
import com.omnizlatoon.orderpipeline.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;
    private final FapshiWebhookService fapshiWebhookService;

    public OrderController(OrderService orderService, FapshiWebhookService fapshiWebhookService) {
        this.orderService = orderService;
        this.fapshiWebhookService = fapshiWebhookService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping("/reference/{orderReference}")
    public OrderResponse getOrderByReference(@PathVariable String orderReference) {
        return orderService.getOrderByReference(orderReference);
    }

    @GetMapping("/{orderId}")
    public OrderResponse getOrder(@PathVariable Long orderId) {
        return orderService.getOrder(orderId);
    }

    @PostMapping("/{orderId}/reconcile-payment")
    public OrderResponse reconcilePayment(@PathVariable Long orderId) {
        fapshiWebhookService.reconcileOrder(orderId);
        return orderService.getOrder(orderId);
    }

    @GetMapping("/{orderId}/audit")
    public List<AuditEventResponse> getAuditTimeline(@PathVariable Long orderId) {
        return orderService.getAuditTimeline(orderId);
    }

    @GetMapping("/{orderId}/notifications")
    public List<NotificationResponse> getNotifications(@PathVariable Long orderId) {
        return orderService.getNotifications(orderId);
    }
}
