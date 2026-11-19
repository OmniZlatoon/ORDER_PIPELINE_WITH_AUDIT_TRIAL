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
                "spring.datasource.url=jdbc:h2:mem:order_success;MODE=MySQL;DB_CLOSE_DELAY=-1",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "app.payment.simulate-failure=false"
        }
)
class OrderProcessingIntegrationTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Long bookId;

    @BeforeEach
    void insertBook() {
        jdbcTemplate.update(
                "INSERT INTO books (title, author, price, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?)",
                "Integration Test Book",
                "Test Author",
                new BigDecimal("12.50"),
                5,
                LocalDateTime.now()
        );
        bookId = jdbcTemplate.queryForObject(
                "SELECT book_id FROM books WHERE title = ?",
                Long.class,
                "Integration Test Book"
        );
    }

    @Test
    void successfulOrderPersistsAllSixStagesAndBothObserverNotifications() {
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
        assertEquals("COMPLETED", order.orderStatus());
        assertEquals("SUCCESS", order.paymentStatus());
        assertEquals(new BigDecimal("25.00"), order.totalAmount());

        AuditEventResponse[] audit = restTemplate.getForObject(
                "/api/orders/{orderId}/audit",
                AuditEventResponse[].class,
                order.orderId()
        );
        assertNotNull(audit);
        assertEquals(12, audit.length);
        assertEquals(List.of(
                "Validate Order", "Check Inventory", "Calculate Total",
                "Process Payment", "Confirm Order", "Complete Order"
        ), List.of(audit[0].stepName(), audit[2].stepName(), audit[4].stepName(),
                audit[6].stepName(), audit[8].stepName(), audit[10].stepName()));
        for (int index = 0; index < audit.length; index += 2) {
            assertEquals("STARTED", audit[index].executionStatus());
            assertEquals("SUCCESS", audit[index + 1].executionStatus());
        }

        NotificationResponse[] notifications = restTemplate.getForObject(
                "/api/orders/{orderId}/notifications",
                NotificationResponse[].class,
                order.orderId()
        );
        assertNotNull(notifications);
        assertEquals(2, notifications.length);
        assertEquals(1, jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE order_id = ? AND notification_type = 'SHIPPING'",
                Integer.class,
                order.orderId()
        ));
        assertEquals(1, jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE order_id = ? AND notification_type = 'EMAIL'",
                Integer.class,
                order.orderId()
        ));
    }
}
