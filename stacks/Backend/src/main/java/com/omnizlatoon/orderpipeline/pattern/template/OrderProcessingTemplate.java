package com.omnizlatoon.orderpipeline.pattern.template;

import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.entity.PaymentStatus;
import com.omnizlatoon.orderpipeline.pattern.decorator.AuditDecorator;
import com.omnizlatoon.orderpipeline.pattern.decorator.OrderStep;
import com.omnizlatoon.orderpipeline.service.AuditService;

import java.util.function.Consumer;

public abstract class OrderProcessingTemplate {
    private final AuditService auditService;

    protected OrderProcessingTemplate(AuditService auditService) {
        this.auditService = auditService;
    }

    public final void processOrder(Order order) {
        runStep(order, "Validate Order", this::validateOrder);
        runStep(order, "Check Inventory", this::checkInventory);
        runStep(order, "Calculate Total", this::calculateTotal);
        runStep(order, "Process Payment", this::processPayment);
        if (order.getPaymentStatus() == PaymentStatus.PENDING) {
            return;
        }
        completeSuccessfulPayment(order);
    }

    public final void completeSuccessfulPayment(Order order) {
        runStep(order, "Confirm Order", this::confirmOrder);
        runStep(order, "Complete Order", this::completeOrder);
    }

    private void runStep(Order order, String name, Consumer<Order> operation) {
        OrderStep decorated = new AuditDecorator(name, operation::accept, auditService);
        decorated.execute(order);
    }

    protected abstract void validateOrder(Order order);

    protected abstract void checkInventory(Order order);

    protected abstract void calculateTotal(Order order);

    protected abstract void processPayment(Order order);

    protected abstract void confirmOrder(Order order);

    protected abstract void completeOrder(Order order);
}
