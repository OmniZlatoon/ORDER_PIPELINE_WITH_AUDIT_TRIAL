package com.omnizlatoon.orderpipeline.pattern.decorator;

import com.omnizlatoon.orderpipeline.entity.AuditExecutionStatus;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.service.AuditService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AuditDecoratorTest {
    @Test
    void recordsStartedAndSuccessAroundTheWrappedOperation() {
        AuditService auditService = mock(AuditService.class);
        Order order = mock(Order.class);
        boolean[] executed = {false};
        AuditDecorator decorator = new AuditDecorator("Validate Order", ignored -> executed[0] = true, auditService);

        decorator.execute(order);

        org.junit.jupiter.api.Assertions.assertTrue(executed[0]);
        verify(auditService).record(order, "VALIDATE ORDER", AuditExecutionStatus.STARTED, "VALIDATE ORDER started");
        verify(auditService).record(order, "VALIDATE ORDER", AuditExecutionStatus.SUCCESS, "VALIDATE ORDER completed");
    }

    @Test
    void recordsFailureAndRethrowsTheOriginalException() {
        AuditService auditService = mock(AuditService.class);
        Order order = mock(Order.class);
        RuntimeException failure = new IllegalStateException("Inventory unavailable");
        AuditDecorator decorator = new AuditDecorator("Check Inventory", ignored -> {
            throw failure;
        }, auditService);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> decorator.execute(order));

        assertSame(failure, thrown);
        verify(auditService).record(order, "CHECK INVENTORY", AuditExecutionStatus.STARTED, "CHECK INVENTORY started");
        verify(auditService).record(order, "CHECK INVENTORY", AuditExecutionStatus.FAILED, "Inventory unavailable");
    }
}
