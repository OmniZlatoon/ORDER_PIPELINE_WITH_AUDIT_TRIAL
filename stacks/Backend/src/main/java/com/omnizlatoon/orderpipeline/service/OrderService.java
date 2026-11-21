package com.omnizlatoon.orderpipeline.service;

import com.omnizlatoon.orderpipeline.dto.AuditEventResponse;
import com.omnizlatoon.orderpipeline.dto.CreateOrderRequest;
import com.omnizlatoon.orderpipeline.dto.CustomerRequest;
import com.omnizlatoon.orderpipeline.dto.NotificationResponse;
import com.omnizlatoon.orderpipeline.dto.OrderItemRequest;
import com.omnizlatoon.orderpipeline.dto.OrderResponse;
import com.omnizlatoon.orderpipeline.entity.Book;
import com.omnizlatoon.orderpipeline.entity.Customer;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.entity.OrderItem;
import com.omnizlatoon.orderpipeline.entity.OrderStatus;
import com.omnizlatoon.orderpipeline.repository.AuditLogRepository;
import com.omnizlatoon.orderpipeline.repository.BookRepository;
import com.omnizlatoon.orderpipeline.repository.CustomerRepository;
import com.omnizlatoon.orderpipeline.repository.NotificationRepository;
import com.omnizlatoon.orderpipeline.repository.OrderRepository;
import com.omnizlatoon.orderpipeline.pattern.template.BookstoreOrderProcessor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final BookRepository bookRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final BookstoreOrderProcessor processor;

    public OrderService(
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            BookRepository bookRepository,
            AuditLogRepository auditLogRepository,
            NotificationRepository notificationRepository,
            BookstoreOrderProcessor processor
    ) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.bookRepository = bookRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
        this.processor = processor;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        CustomerRequest customerInput = request == null ? null : request.customer();
        String fullName = customerInput == null || customerInput.fullName() == null
                ? ""
                : customerInput.fullName().trim();
        String email = customerInput == null || customerInput.email() == null
                ? ""
                : customerInput.email().trim();
        Customer customer = customerRepository.saveAndFlush(new Customer(fullName, email));

        String reference = "ORD-" + Year.now() + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Order order = orderRepository.saveAndFlush(new Order(reference, customer));
        List<OrderItemRequest> requestedItems = request == null ? null : request.items();
        if (requestedItems != null) {
            for (OrderItemRequest itemRequest : requestedItems) {
                if (itemRequest == null || itemRequest.bookId() == null || itemRequest.quantity() == null) {
                    order.setValidationIssue("Each order item must include a book ID and quantity");
                    continue;
                }
                if (itemRequest.quantity() <= 0) {
                    order.setValidationIssue("Book quantities must be positive");
                    continue;
                }
                Book book = bookRepository.findById(itemRequest.bookId()).orElse(null);
                if (book == null) {
                    order.addMissingBookId(itemRequest.bookId());
                    continue;
                }
                order.addItem(new OrderItem(book, itemRequest.quantity()));
            }
        }

        try {
            processor.processOrder(order);
        } catch (OrderProcessingException exception) {
            order.setOrderStatus(OrderStatus.FAILED);
        }
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) {
        return OrderResponse.from(requireOrder(orderId));
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByReference(String orderReference) {
        return orderRepository.findByOrderReferenceIgnoreCase(orderReference)
                .map(OrderResponse::from)
                .orElseThrow(() -> new OrderNotFoundException(orderReference));
    }

    @Transactional(readOnly = true)
    public List<AuditEventResponse> getAuditTimeline(Long orderId) {
        requireOrder(orderId);
        return auditLogRepository.findTimelineByOrderId(orderId)
                .stream()
                .map(AuditEventResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long orderId) {
        requireOrder(orderId);
        return notificationRepository.findAllByOrder_IdOrderByCreatedAtAscIdAsc(orderId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    private Order requireOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
    }
}
