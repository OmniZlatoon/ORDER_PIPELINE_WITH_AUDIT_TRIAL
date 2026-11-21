package com.omnizlatoon.orderpipeline;

import com.omnizlatoon.orderpipeline.dto.AuditEventResponse;
import com.omnizlatoon.orderpipeline.dto.CreateOrderRequest;
import com.omnizlatoon.orderpipeline.dto.CustomerRequest;
import com.omnizlatoon.orderpipeline.dto.NotificationResponse;
import com.omnizlatoon.orderpipeline.dto.OrderItemRequest;
import com.omnizlatoon.orderpipeline.dto.OrderResponse;
import com.omnizlatoon.orderpipeline.dto.UsdXafExchangeRateResponse;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.service.ExchangeRateService;
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
import java.time.Instant;
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

    @MockBean
    private ExchangeRateService exchangeRateService;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Long bookId;
    private Long secondBookId;

    @BeforeEach
    void insertBook() {
        String title = "Integration Test Book " + UUID.randomUUID();
        when(hostedPaymentService.createCheckout(any(Order.class))).thenAnswer(invocation ->
                new HostedPaymentService.Checkout(
                        "fapshi-test-" + UUID.randomUUID(),
                        "https://pay.fapshi.com/test-checkout",
                        7500,
                        new BigDecimal("600.00000000")
                )
        );
        when(exchangeRateService.getUsdToXafRate()).thenReturn(
                new ExchangeRateService.RateSnapshot(
                        new BigDecimal("600.00000000"),
                        Instant.parse("2026-11-20T00:00:00Z"),
                        Instant.parse("2026-11-21T00:00:00Z")
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
        String secondTitle = "Second Integration Test Book " + UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO books (title, author, price, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?)",
                secondTitle,
                "Second Test Author",
                new BigDecimal("12.50"),
                5,
                LocalDateTime.now()
        );
        secondBookId = jdbcTemplate.queryForObject(
                "SELECT book_id FROM books WHERE title = ?",
                Long.class,
                secondTitle
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
        assertEquals(1, order.items().size());
        assertEquals(bookId, order.items().getFirst().bookId());

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
    void distinctBooksRemainSeparateOrderItemsAndCanBeLookedUpByReference() {
        CreateOrderRequest request = new CreateOrderRequest(
                new CustomerRequest("Test Customer", "customer@example.com"),
                List.of(
                        new OrderItemRequest(bookId, 2),
                        new OrderItemRequest(secondBookId, 1)
                )
        );

        ResponseEntity<OrderResponse> created = restTemplate.exchange(
                "/api/orders",
                HttpMethod.POST,
                new HttpEntity<>(request),
                OrderResponse.class
        );

        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        OrderResponse order = created.getBody();
        assertNotNull(order);
        assertEquals(2, order.items().size());
        assertEquals(List.of(bookId, secondBookId),
                order.items().stream().map(item -> item.bookId()).toList());
        assertEquals(new BigDecimal("37.50"), order.totalAmount());

        ResponseEntity<OrderResponse> lookup = restTemplate.getForEntity(
                "/api/orders/reference/{orderReference}",
                OrderResponse.class,
                order.orderReference().toLowerCase()
        );
        assertEquals(HttpStatus.OK, lookup.getStatusCode());
        assertNotNull(lookup.getBody());
        assertEquals(order.orderId(), lookup.getBody().orderId());
        assertEquals(2, lookup.getBody().items().size());
    }

    @Test
    void usdToXafRateEndpointReturnsTheBackendRateSnapshot() {
        ResponseEntity<UsdXafExchangeRateResponse> response = restTemplate.getForEntity(
                "/api/exchange-rate/usd-xaf",
                UsdXafExchangeRateResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("USD", response.getBody().baseCurrency());
        assertEquals("XAF", response.getBody().quoteCurrency());
        assertEquals(new BigDecimal("600.00000000"), response.getBody().rate());
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
