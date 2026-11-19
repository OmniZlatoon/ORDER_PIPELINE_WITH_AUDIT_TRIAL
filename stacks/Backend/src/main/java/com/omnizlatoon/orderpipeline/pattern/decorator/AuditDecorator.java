package com.omnizlatoon.orderpipeline.pattern.decorator;

import com.omnizlatoon.orderpipeline.entity.AuditExecutionStatus;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.service.AuditService;

public final class AuditDecorator implements OrderStep {
    private final String stepName;
    private final OrderStep wrapped;
    private final AuditService auditService;

    public AuditDecorator(String stepName, OrderStep wrapped, AuditService auditService) {
        this.stepName = stepName;
        this.wrapped = wrapped;
        this.auditService = auditService;
    }

    @Override
    public void execute(Order order) {
        auditService.record(order, stepName, AuditExecutionStatus.STARTED, stepName + " started");
        try {
            wrapped.execute(order);
            auditService.record(order, stepName, AuditExecutionStatus.SUCCESS, stepName + " completed");
        } catch (RuntimeException exception) {
            try {
                auditService.record(order, stepName, AuditExecutionStatus.FAILED, exception.getMessage());
            } catch (RuntimeException auditException) {
                exception.addSuppressed(auditException);
            }
            throw exception;
        }
    }
}
