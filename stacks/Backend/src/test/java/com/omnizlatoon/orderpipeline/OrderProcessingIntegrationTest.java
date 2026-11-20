package com.omnizlatoon.orderpipeline;

import com.omnizlatoon.orderpipeline.dto.AuditEventResponse;
import com.omnizlatoon.orderpipeline.dto.CreateOrderRequest;
import com.omnizlatoon.orderpipeline.dto.CustomerRequest;
import com.omnizlatoon.orderpipeline.dto.NotificationResponse;
import com.omnizlatoon.orderpipeline.dto.OrderItemRequest;
import com.omnizlatoon.orderpipeline.dto.OrderResponse;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.service.HostedPaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:order_success;MODE=MySQL;DB_CLOSE_DELAY=-1",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "app.payment.simulate-failure=false"
        }
)
class OrderProcessingIntegrationTest {
    @MockBean
    private HostedPaymentService hostedPaymentService;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Long bookId;

    @BeforeEach
    void insertBook() {
        String title = "Integration Test Book " + UUID.randomUUID();
        when(hostedPaymentService.createCheckout(any(Order.class))).thenReturn(
                new HostedPaymentService.Checkout(
                        "fapshi-test-transaction",
                        "https://pay.fapshi.com/test-checkout",
                        7500,
                        new BigDecimal("600.00000000")
                )
        );
        jdbcTemplate.update(
                "INSERT INTO books (title, author, price, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?)",
                title,
                "Test Author",
                new BigDecimal("12.50"),
                5,
                LocalDateTime.now()
        );
        bookId = jdbcTemplate.queryForObject(
                "SELECT book_id FROM books WHERE title = ?",
                Long.class,
                title
        );
    }

    @Test
    void createdOrderPersistsPendingPaymentAndUppercaseAuditStages() {
        CreateOrderRequest request = new CreateOrderRequest(
                new CustomerRequest("Test Customer", "customer@example.com"),
                List.of(new OrderItemRequest(bookId, 2))
        );

        ResponseEntity<OrderResponse> response = restTemplate.exchange(
                "/api/orders",
                HttpMethod.POST,
                new HttpEntity<>(request),
                OrderResponse.class
        );

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        OrderResponse order = response.getBody();
        assertNotNull(order);
        assertEquals("PROCESSING", order.orderStatus());
        assertEquals("PENDING", order.paymentStatus());
        assertEquals(new BigDecimal("25.00"), order.totalAmount());
        assertEquals(7500L, order.paymentAmountXaf());
        assertEquals("https://pay.fapshi.com/test-checkout", order.paymentLink());

        AuditEventResponse[] audit = restTemplate.getForObject(
                "/api/orders/{orderId}/audit",
                AuditEventResponse[].class,
                order.orderId()
        );
        assertNotNull(audit);
        assertEquals(8, audit.length);
        assertEquals(List.of(
                "VALIDATE ORDER", "CHECK INVENTORY", "CALCULATE TOTAL", "PROCESS PAYMENT"
        ), List.of(audit[0].stepName(), audit[2].stepName(), audit[4].stepName(),
                audit[6].stepName()));
        for (int index = 0; index < 6; index += 2) {
            assertEquals("STARTED", audit[index].executionStatus());
            assertEquals("SUCCESS", audit[index + 1].executionStatus());
        }
        assertEquals("STARTED", audit[6].executionStatus());
        assertEquals("PENDING", audit[7].executionStatus());

        NotificationResponse[] notifications = restTemplate.getForObject(
                "/api/orders/{orderId}/notifications",
                NotificationResponse[].class,
                order.orderId()
        );
        assertNotNull(notifications);
        assertEquals(0, notifications.length);
    }

    @Test
    void uncertainFapshiCreationRemainsPendingAndIsNotReportedAsFailure() {
        when(hostedPaymentService.createCheckout(any(Order.class))).thenThrow(
                new HostedPaymentService.PaymentInitiationUncertainException(
                        "Fapshi did not confirm checkout creation. Please do not retry until the transaction is reconciled.",
                        new IllegalStateException("simulated network timeout")
                )
        );
        CreateOrderRequest request = new CreateOrderRequest(
                new CustomerRequest("Test Customer", "customer@example.com"),
                List.of(new OrderItemRequest(bookId, 1))
        );

        ResponseEntity<OrderResponse> response = restTemplate.exchange(
                "/api/orders",
                HttpMethod.POST,
                new HttpEntity<>(request),
                OrderResponse.class
        );

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        OrderResponse order = response.getBody();
        assertNotNull(order);
        assertEquals("PROCESSING", order.orderStatus());
        assertEquals("PENDING", order.paymentStatus());
        assertNull(order.paymentLink());
        AuditEventResponse[] audit = restTemplate.getForObject(
                "/api/orders/{orderId}/audit", AuditEventResponse[].class, order.orderId());
        assertNotNull(audit);
        assertEquals(8, audit.length);
        assertEquals("PENDING", audit[7].executionStatus());
    }
}
