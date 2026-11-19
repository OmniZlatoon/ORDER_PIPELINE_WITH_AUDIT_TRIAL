package com.omnizlatoon.orderpipeline.pattern.template;

import com.omnizlatoon.orderpipeline.entity.Book;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.entity.OrderItem;
import com.omnizlatoon.orderpipeline.entity.OrderStatus;
import com.omnizlatoon.orderpipeline.entity.PaymentStatus;
import com.omnizlatoon.orderpipeline.pattern.observer.OrderCompletionPublisher;
import com.omnizlatoon.orderpipeline.repository.OrderItemRepository;
import com.omnizlatoon.orderpipeline.service.AuditService;
import com.omnizlatoon.orderpipeline.service.OrderProcessingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class BookstoreOrderProcessor extends OrderProcessingTemplate {
    private final OrderItemRepository orderItemRepository;
    private final OrderCompletionPublisher completionPublisher;
    private final boolean simulatePaymentFailure;

    public BookstoreOrderProcessor(
            AuditService auditService,
            OrderItemRepository orderItemRepository,
            OrderCompletionPublisher completionPublisher,
            @Value("${app.payment.simulate-failure:false}") boolean simulatePaymentFailure
    ) {
        super(auditService);
        this.orderItemRepository = orderItemRepository;
        this.completionPublisher = completionPublisher;
        this.simulatePaymentFailure = simulatePaymentFailure;
    }

    @Override
    protected void validateOrder(Order order) {
        if (order.getValidationIssue() != null) {
            throw new OrderProcessingException(order.getValidationIssue());
        }
        if (order.getCustomer().getFullName() == null || order.getCustomer().getFullName().isBlank()) {
            throw new OrderProcessingException("Customer name is required");
        }
        String email = order.getCustomer().getEmail();
        if (email == null || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new OrderProcessingException("A valid customer email address is required");
        }
        if (order.getItems().isEmpty() && order.getMissingBookIds().isEmpty()) {
            throw new OrderProcessingException("The order must contain at least one book");
        }
    }

    @Override
    protected void checkInventory(Order order) {
        if (!order.getMissingBookIds().isEmpty()) {
            throw new OrderProcessingException("One or more requested books do not exist");
        }
        for (OrderItem item : order.getItems()) {
            Book book = item.getBook();
            if (item.getQuantity() <= 0) {
                throw new OrderProcessingException("Book quantities must be positive");
            }
            if (book.getStockQuantity() < item.getQuantity()) {
                throw new OrderProcessingException("Insufficient stock for " + book.getTitle());
            }
        }
    }

    @Override
    protected void calculateTotal(Order order) {
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            BigDecimal unitPrice = item.getBook().getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setUnitPrice(unitPrice);
            item.setLineTotal(lineTotal);
            total = total.add(lineTotal);
        }
        order.setTotalAmount(total);
        orderItemRepository.saveAll(order.getItems());
    }

    @Override
    protected void processPayment(Order order) {
        if (simulatePaymentFailure) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            throw new OrderProcessingException("Simulated payment was declined");
        }
        order.setPaymentStatus(PaymentStatus.SUCCESS);
    }

    @Override
    protected void confirmOrder(Order order) {
        order.setOrderStatus(OrderStatus.CONFIRMED);
    }

    @Override
    protected void completeOrder(Order order) {
        order.setOrderStatus(OrderStatus.COMPLETED);
        order.setCompletedAt(LocalDateTime.now());
        completionPublisher.publish(order);
    }
}
