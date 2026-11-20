package com.omnizlatoon.orderpipeline.service;

import com.omnizlatoon.orderpipeline.dto.FapshiWebhookRequest;
import com.omnizlatoon.orderpipeline.entity.AuditExecutionStatus;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.entity.OrderStatus;
import com.omnizlatoon.orderpipeline.entity.PaymentStatus;
import com.omnizlatoon.orderpipeline.pattern.template.BookstoreOrderProcessor;
import com.omnizlatoon.orderpipeline.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class FapshiWebhookService {
    private static final Logger logger = LoggerFactory.getLogger(FapshiWebhookService.class);
    private static final Set<String> ACCEPTED_STATUSES =
            Set.of("CREATED", "PENDING", "SUCCESSFUL", "FAILED", "EXPIRED");
    private static final Duration RECONCILIATION_INTERVAL = Duration.ofSeconds(15);

    private final FapshiApiClient fapshiApiClient;
    private final OrderRepository orderRepository;
    private final AuditService auditService;
    private final BookstoreOrderProcessor processor;
    private final ConcurrentMap<String, Instant> lastStatusCheckAt = new ConcurrentHashMap<>();

    public FapshiWebhookService(
            FapshiApiClient fapshiApiClient,
            OrderRepository orderRepository,
            AuditService auditService,
            BookstoreOrderProcessor processor
    ) {
        this.fapshiApiClient = fapshiApiClient;
        this.orderRepository = orderRepository;
        this.auditService = auditService;
        this.processor = processor;
    }

    @Transactional
    public void process(FapshiWebhookRequest request) {
        if (request.transId() == null || request.transId().isBlank()
                || request.transId().length() > 100 || request.status() == null
                || request.amount() == null || request.externalId() == null || request.externalId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Fapshi webhook payload.");
        }
        String callbackStatus = request.status().toUpperCase(Locale.ROOT);
        if (!ACCEPTED_STATUSES.contains(callbackStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported Fapshi payment status.");
        }

        Order order = orderRepository.findByFapshiTransactionIdForUpdate(request.transId()).orElse(null);
        if (order != null && order.getPaymentStatus() != PaymentStatus.PENDING) {
            return;
        }

        if (order == null) {
            order = orderRepository.findByOrderReferenceForUpdate(request.externalId()).orElse(null);
        }
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No order matches this Fapshi transaction.");
        }
        if (order.getFapshiTransactionId() != null
                && !order.getFapshiTransactionId().equals(request.transId())) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "Fapshi transaction does not match the order.");
        }
        if (!order.getOrderReference().equals(request.externalId())
                || order.getPaymentAmountXaf() == null
                || !order.getPaymentAmountXaf().equals(request.amount())) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "Fapshi transaction details do not match the order.");
        }
        if (order.getFapshiTransactionId() == null) {
            order.setFapshiTransactionId(request.transId());
        }
        reconcileFromProvider(order, request.transId());
    }

    @Transactional
    public void reconcileOrder(Long orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            return;
        }
        String transactionId = order.getFapshiTransactionId();
        if (transactionId == null || transactionId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "No Fapshi transaction is available for this order.");
        }
        enforceReconciliationInterval(transactionId);
        reconcileFromProvider(order, transactionId);
    }

    private void enforceReconciliationInterval(String transactionId) {
        Instant now = Instant.now();
        AtomicBoolean allowed = new AtomicBoolean();
        lastStatusCheckAt.compute(transactionId, (key, previousCheck) -> {
            if (previousCheck == null || !previousCheck.plus(RECONCILIATION_INTERVAL).isAfter(now)) {
                allowed.set(true);
                return now;
            }
            return previousCheck;
        });
        if (!allowed.get()) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS, "Please wait before checking this payment again.");
        }
    }

    private void reconcileFromProvider(Order order, String transactionId) {
        FapshiApiClient.TransactionStatusResponse verified;
        try {
            verified = fapshiApiClient.getPaymentStatus(transactionId);
        } catch (RestClientException | IllegalStateException exception) {
            logger.warn("Could not reconcile Fapshi transaction status: {}",
                    exception.getClass().getSimpleName());
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Fapshi payment status could not be verified.", exception);
        }

        if (!transactionId.equals(verified.transId())) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fapshi transaction ID did not match.");
        }
        if (!order.getOrderReference().equals(verified.externalId())
                || order.getPaymentAmountXaf() == null
                || verified.amount() == null
                || !verified.amount().equals(order.getPaymentAmountXaf())) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "Fapshi transaction details do not match the order.");
        }
        String status = verified.status().toUpperCase(Locale.ROOT);
        if (!ACCEPTED_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Fapshi returned an unsupported status.");
        }
        if (!Set.of("SUCCESSFUL", "FAILED", "EXPIRED").contains(status)) {
            return;
        }

        lastStatusCheckAt.remove(transactionId);
        if ("SUCCESSFUL".equals(status)) {
            order.setPaymentStatus(PaymentStatus.SUCCESS);
            auditService.record(order, "PROCESS PAYMENT", AuditExecutionStatus.SUCCESS,
                    "Fapshi confirmed payment.");
            processor.completeSuccessfulPayment(order);
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setOrderStatus(OrderStatus.FAILED);
            String message = "EXPIRED".equals(status)
                    ? "Fapshi payment link expired before payment was completed."
                    : "Fapshi reported the payment as FAILED.";
            auditService.record(order, "PROCESS PAYMENT", AuditExecutionStatus.FAILED, message);
        }
    }
}
