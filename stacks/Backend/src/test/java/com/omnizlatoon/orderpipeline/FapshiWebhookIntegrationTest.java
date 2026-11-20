package com.omnizlatoon.orderpipeline;

import com.omnizlatoon.orderpipeline.dto.AuditEventResponse;
import com.omnizlatoon.orderpipeline.dto.CreateOrderRequest;
import com.omnizlatoon.orderpipeline.dto.CustomerRequest;
import com.omnizlatoon.orderpipeline.dto.FapshiWebhookRequest;
import com.omnizlatoon.orderpipeline.dto.NotificationResponse;
import com.omnizlatoon.orderpipeline.dto.OrderItemRequest;
import com.omnizlatoon.orderpipeline.dto.OrderResponse;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.service.FapshiApiClient;
import com.omnizlatoon.orderpipeline.service.HostedPaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.client.ResourceAccessException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:order_fapshi_webhook;MODE=MySQL;DB_CLOSE_DELAY=-1",
                "spring.datasource.driver-class-name=org.h2.Driver",
                "spring.datasource.username=sa",
                "spring.datasource.password=",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "app.fapshi.webhook-secret=test-webhook-secret",
                "app.payment.simulate-failure=false"
        }
)
class FapshiWebhookIntegrationTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private HostedPaymentService hostedPaymentService;

    @MockBean
    private FapshiApiClient fapshiApiClient;

    @BeforeEach
    void setUpCheckout() {
        when(hostedPaymentService.createCheckout(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            return new HostedPaymentService.Checkout(
                    "trans-" + order.getId(),
                    "https://pay.fapshi.com/checkout",
                    6000,
                    new BigDecimal("600.00000000")
            );
        });
    }

    @Test
    void verifiedSuccessCompletesOrderAndDuplicateWebhookDoesNotRepeatEffects() {
        OrderResponse pendingOrder = createPendingOrder();
        String transactionId = "trans-" + pendingOrder.orderId();
        when(fapshiApiClient.getPaymentStatus(transactionId)).thenReturn(
                new FapshiApiClient.TransactionStatusResponse(
                        transactionId, "SUCCESSFUL", 6000L, pendingOrder.orderReference()
                )
        );

        ResponseEntity<Void> callback = postWebhook(
                transactionId, "SUCCESSFUL", "test-webhook-secret", 6000L, pendingOrder.orderReference());
        assertEquals(HttpStatus.OK, callback.getStatusCode());

        OrderResponse completedOrder = restTemplate.getForObject(
                "/api/orders/{orderId}", OrderResponse.class, pendingOrder.orderId());
        assertNotNull(completedOrder);
        assertEquals("SUCCESS", completedOrder.paymentStatus());
        assertEquals("COMPLETED", completedOrder.orderStatus());

        AuditEventResponse[] audit = getAudit(pendingOrder.orderId());
        assertEquals("PROCESS PAYMENT", audit[audit.length - 5].stepName());
        assertEquals("SUCCESS", audit[audit.length - 5].executionStatus());
        for (AuditEventResponse event : audit) {
            assertEquals(event.stepName(), event.stepName().toUpperCase(java.util.Locale.ROOT));
        }
        assertAllStagesSucceeded(audit);

        NotificationResponse[] notifications = restTemplate.getForObject(
                "/api/orders/{orderId}/notifications", NotificationResponse[].class, pendingOrder.orderId());
        assertNotNull(notifications);
        assertEquals(2, notifications.length);
        assertEquals(Set.of("SHIPPING", "EMAIL"),
                Arrays.stream(notifications).map(NotificationResponse::notificationType).collect(Collectors.toSet()));
        assertTrue(Arrays.stream(notifications).allMatch(notification -> "SENT".equals(notification.status())));

        int auditCount = audit.length;
        assertEquals(HttpStatus.OK,
                postWebhook(transactionId, "SUCCESSFUL", "test-webhook-secret",
                        6000L, pendingOrder.orderReference()).getStatusCode());
        assertEquals(auditCount, getAudit(pendingOrder.orderId()).length);
        verify(fapshiApiClient).getPaymentStatus(transactionId);
    }

    @Test
    void verifiedFailureMarksOrderAndAuditFailedWithoutNotifications() {
        OrderResponse pendingOrder = createPendingOrder();
        String transactionId = "trans-" + pendingOrder.orderId();
        when(fapshiApiClient.getPaymentStatus(transactionId)).thenReturn(
                new FapshiApiClient.TransactionStatusResponse(
                        transactionId, "FAILED", 6000L, pendingOrder.orderReference()
                )
        );

        assertEquals(HttpStatus.OK,
                postWebhook(transactionId, "FAILED", "test-webhook-secret",
                        6000L, pendingOrder.orderReference()).getStatusCode());

        OrderResponse failedOrder = restTemplate.getForObject(
                "/api/orders/{orderId}", OrderResponse.class, pendingOrder.orderId());
        assertNotNull(failedOrder);
        assertEquals("FAILED", failedOrder.paymentStatus());
        assertEquals("FAILED", failedOrder.orderStatus());

        AuditEventResponse[] audit = getAudit(pendingOrder.orderId());
        AuditEventResponse lastEvent = audit[audit.length - 1];
        assertEquals("PROCESS PAYMENT", lastEvent.stepName());
        assertEquals("FAILED", lastEvent.executionStatus());
        assertEquals("Fapshi reported the payment as FAILED.", lastEvent.message());

        NotificationResponse[] notifications = restTemplate.getForObject(
                "/api/orders/{orderId}/notifications", NotificationResponse[].class, pendingOrder.orderId());
        assertNotNull(notifications);
        assertEquals(0, notifications.length);
    }

    @Test
    void successfulWebhookDoesNotCompleteOrderWhileProviderStillReportsPending() {
        OrderResponse pendingOrder = createPendingOrder();
        String transactionId = "trans-" + pendingOrder.orderId();
        when(fapshiApiClient.getPaymentStatus(transactionId)).thenReturn(
                new FapshiApiClient.TransactionStatusResponse(
                        transactionId, "PENDING", 6000L, pendingOrder.orderReference()
                )
        );

        assertEquals(HttpStatus.OK,
                postWebhook(transactionId, "SUCCESSFUL", "test-webhook-secret",
                        6000L, pendingOrder.orderReference()).getStatusCode());

        OrderResponse stillPending = restTemplate.getForObject(
                "/api/orders/{orderId}", OrderResponse.class, pendingOrder.orderId());
        assertNotNull(stillPending);
        assertEquals("PENDING", stillPending.paymentStatus());
        assertEquals("PROCESSING", stillPending.orderStatus());
        assertEquals(8, getAudit(pendingOrder.orderId()).length);
    }

    @Test
    void doesNotApplyWebhookWhenProviderAmountDoesNotMatchOrder() {
        OrderResponse pendingOrder = createPendingOrder();
        String transactionId = "trans-" + pendingOrder.orderId();
        when(fapshiApiClient.getPaymentStatus(transactionId)).thenReturn(
                new FapshiApiClient.TransactionStatusResponse(
                        transactionId, "SUCCESSFUL", 6001L, pendingOrder.orderReference()
                )
        );

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY,
                postWebhook(transactionId, "SUCCESSFUL", "test-webhook-secret",
                        6000L, pendingOrder.orderReference()).getStatusCode());

        OrderResponse stillPending = restTemplate.getForObject(
                "/api/orders/{orderId}", OrderResponse.class, pendingOrder.orderId());
        assertNotNull(stillPending);
        assertEquals("PENDING", stillPending.paymentStatus());
        assertEquals(8, getAudit(pendingOrder.orderId()).length);
    }

    @Test
    void rejectsWebhookWhenItsAmountDoesNotMatchOrder() {
        OrderResponse pendingOrder = createPendingOrder();
        String transactionId = "trans-" + pendingOrder.orderId();

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, postWebhook(
                transactionId, "SUCCESSFUL", "test-webhook-secret",
                6001L, pendingOrder.orderReference()).getStatusCode());

        verify(fapshiApiClient, never()).getPaymentStatus(any());
        OrderResponse stillPending = restTemplate.getForObject(
                "/api/orders/{orderId}", OrderResponse.class, pendingOrder.orderId());
        assertNotNull(stillPending);
        assertEquals("PENDING", stillPending.paymentStatus());
        assertEquals(8, getAudit(pendingOrder.orderId()).length);
    }

    @Test
    void paymentReconciliationCompletesOrderAfterProviderStatusBecomesAvailable() {
        OrderResponse pendingOrder = createPendingOrder();
        String transactionId = "trans-" + pendingOrder.orderId();
        when(fapshiApiClient.getPaymentStatus(transactionId))
                .thenThrow(new ResourceAccessException("simulated status API timeout"))
                .thenReturn(new FapshiApiClient.TransactionStatusResponse(
                        transactionId, "SUCCESSFUL", 6000L, pendingOrder.orderReference()));

        assertEquals(HttpStatus.BAD_GATEWAY, postWebhook(
                transactionId, "SUCCESSFUL", "test-webhook-secret",
                6000L, pendingOrder.orderReference()).getStatusCode());

        OrderResponse stillPending = restTemplate.getForObject(
                "/api/orders/{orderId}", OrderResponse.class, pendingOrder.orderId());
        assertNotNull(stillPending);
        assertEquals("PENDING", stillPending.paymentStatus());
        assertEquals("PROCESSING", stillPending.orderStatus());
        assertEquals(8, getAudit(pendingOrder.orderId()).length);

        ResponseEntity<OrderResponse> reconciliation = restTemplate.exchange(
                "/api/orders/{orderId}/reconcile-payment",
                HttpMethod.POST,
                HttpEntity.EMPTY,
                OrderResponse.class,
                pendingOrder.orderId());
        assertEquals(HttpStatus.OK, reconciliation.getStatusCode());
        OrderResponse completedOrder = reconciliation.getBody();
        assertNotNull(completedOrder);
        assertEquals("SUCCESS", completedOrder.paymentStatus());
        assertEquals("COMPLETED", completedOrder.orderStatus());
        assertAllStagesSucceeded(getAudit(pendingOrder.orderId()));

        NotificationResponse[] notifications = restTemplate.getForObject(
                "/api/orders/{orderId}/notifications", NotificationResponse[].class, pendingOrder.orderId());
        assertNotNull(notifications);
        assertEquals(2, notifications.length);
        assertTrue(Arrays.stream(notifications).allMatch(notification -> "SENT".equals(notification.status())));
    }

    @Test
    void rejectsWebhookWithoutValidSecretBeforeCallingFapshi() {
        ResponseEntity<Void> response = postWebhook(
                "untrusted-transaction", "SUCCESSFUL", "wrong-secret", null, null);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(fapshiApiClient, never()).getPaymentStatus(any());
    }

    private OrderResponse createPendingOrder() {
        String title = "Webhook Book " + UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO books (title, author, price, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?)",
                title, "Test Author", new BigDecimal("10.00"), 5, LocalDateTime.now()
        );
        Long bookId = jdbcTemplate.queryForObject(
                "SELECT book_id FROM books WHERE title = ?", Long.class, title);
        CreateOrderRequest request = new CreateOrderRequest(
                new CustomerRequest("Test Customer", "customer@example.com"),
                List.of(new OrderItemRequest(bookId, 1))
        );
        ResponseEntity<OrderResponse> response = restTemplate.exchange(
                "/api/orders", HttpMethod.POST, new HttpEntity<>(request), OrderResponse.class);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        OrderResponse order = response.getBody();
        assertNotNull(order);
        assertEquals("PENDING", order.paymentStatus());
        return order;
    }

    private ResponseEntity<Void> postWebhook(
            String transactionId,
            String status,
            String secret,
            Long amount,
            String externalId
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-wh-secret", secret);
        return restTemplate.exchange(
                "/fapshi_demo/webhook",
                HttpMethod.POST,
                new HttpEntity<>(new FapshiWebhookRequest(transactionId, status, amount, externalId), headers),
                Void.class
        );
    }

    private AuditEventResponse[] getAudit(Long orderId) {
        AuditEventResponse[] audit = restTemplate.getForObject(
                "/api/orders/{orderId}/audit", AuditEventResponse[].class, orderId);
        assertNotNull(audit);
        return audit;
    }

    private void assertAllStagesSucceeded(AuditEventResponse[] audit) {
        Set<String> successfulStages = Arrays.stream(audit)
                .filter(event -> "SUCCESS".equals(event.executionStatus()))
                .map(AuditEventResponse::stepName)
                .collect(Collectors.toSet());
        assertEquals(Set.of(
                "VALIDATE ORDER",
                "CHECK INVENTORY",
                "CALCULATE TOTAL",
                "PROCESS PAYMENT",
                "CONFIRM ORDER",
                "COMPLETE ORDER"
        ), successfulStages);
    }
}
