package com.omnizlatoon.orderpipeline.pattern.template;

import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.service.AuditService;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class OrderProcessingTemplateTest {
    @Test
    void executesTheSixStagesInTheRequiredOrder() {
        List<String> stages = new ArrayList<>();
        RecordingProcessor processor = new RecordingProcessor(mock(AuditService.class), stages, null);

        processor.processOrder(mock(Order.class));

        assertEquals(List.of(
                "Validate Order",
                "Check Inventory",
                "Calculate Total",
                "Process Payment",
                "Confirm Order",
                "Complete Order"
        ), stages);
    }

    @Test
    void stopsImmediatelyWhenAStageFails() {
        List<String> stages = new ArrayList<>();
        RecordingProcessor processor = new RecordingProcessor(
                mock(AuditService.class),
                stages,
                "Process Payment"
        );

        assertThrows(IllegalStateException.class, () -> processor.processOrder(mock(Order.class)));

        assertEquals(List.of(
                "Validate Order",
                "Check Inventory",
                "Calculate Total",
                "Process Payment"
        ), stages);
    }

    private static final class RecordingProcessor extends OrderProcessingTemplate {
        private final List<String> stages;
        private final String failingStage;

        private RecordingProcessor(AuditService auditService, List<String> stages, String failingStage) {
            super(auditService);
            this.stages = stages;
            this.failingStage = failingStage;
        }

        private void record(String name) {
            stages.add(name);
            if (name.equals(failingStage)) {
                throw new IllegalStateException(name);
            }
        }

        @Override
        protected void validateOrder(Order order) {
            record("Validate Order");
        }

        @Override
        protected void checkInventory(Order order) {
            record("Check Inventory");
        }

        @Override
        protected void calculateTotal(Order order) {
            record("Calculate Total");
        }

        @Override
        protected void processPayment(Order order) {
            record("Process Payment");
        }

        @Override
        protected void confirmOrder(Order order) {
            record("Confirm Order");
        }

        @Override
        protected void completeOrder(Order order) {
            record("Complete Order");
        }
    }
}
