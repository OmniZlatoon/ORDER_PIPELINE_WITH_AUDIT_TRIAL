package com.omnizlatoon.orderpipeline;

import com.omnizlatoon.orderpipeline.dto.AuditEventResponse;
import com.omnizlatoon.orderpipeline.dto.CreateOrderRequest;
import com.omnizlatoon.orderpipeline.dto.CustomerRequest;
import com.omnizlatoon.orderpipeline.dto.NotificationResponse;
import com.omnizlatoon.orderpipeline.dto.OrderItemRequest;
import com.omnizlatoon.orderpipeline.dto.OrderResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:order_payment_failure;MODE=MySQL;DB_CLOSE_DELAY=-1",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "app.payment.simulate-failure=true"
        }
)
class PaymentFailureIntegrationTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Long bookId;

    @BeforeEach
    void insertBook() {
        jdbcTemplate.update(
                "INSERT INTO books (title, author, price, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?)",
                "Failure Test Book",
                "Test Author",
                new BigDecimal("10.00"),
                4,
                LocalDateTime.now()
        );
        bookId = jdbcTemplate.queryForObject(
                "SELECT book_id FROM books WHERE title = ?",
                Long.class,
                "Failure Test Book"
        );
    }

    @Test
    void failedPaymentStopsPipelinePersistsFailureAuditAndDoesNotNotifyObservers() {
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
        assertEquals("FAILED", order.orderStatus());
        assertEquals("FAILED", order.paymentStatus());

        AuditEventResponse[] audit = restTemplate.getForObject(
                "/api/orders/{orderId}/audit",
                AuditEventResponse[].class,
                order.orderId()
        );
        assertNotNull(audit);
        assertEquals(8, audit.length);
        assertEquals("FAILED", audit[7].executionStatus());
        assertEquals("Process Payment", audit[7].stepName());

        NotificationResponse[] notifications = restTemplate.getForObject(
                "/api/orders/{orderId}/notifications",
                NotificationResponse[].class,
                order.orderId()
        );
        assertNotNull(notifications);
        assertEquals(0, notifications.length);
    }
}
