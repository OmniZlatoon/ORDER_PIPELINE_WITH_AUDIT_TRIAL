package com.omnizlatoon.orderpipeline.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnizlatoon.orderpipeline.entity.Customer;
import com.omnizlatoon.orderpipeline.entity.Order;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HostedPaymentServiceTest {
    private FapshiApiClient fapshiApiClient;
    private ExchangeRateService exchangeRateService;
    private HostedPaymentService hostedPaymentService;
    private Order order;
    private Customer customer;

    @BeforeEach
    void setUp() {
        fapshiApiClient = mock(FapshiApiClient.class);
        exchangeRateService = mock(ExchangeRateService.class);
        hostedPaymentService = new HostedPaymentService(
                fapshiApiClient, exchangeRateService, "https://shop.example.test");
        order = mock(Order.class);
        customer = mock(Customer.class);
        when(order.getId()).thenReturn(27L);
        when(order.getOrderReference()).thenReturn("ORD-2026-ABC12345");
        when(order.getCustomer()).thenReturn(customer);
        when(customer.getEmail()).thenReturn("customer@example.com");
        when(exchangeRateService.getUsdToXafRate()).thenReturn(
                new ExchangeRateService.RateSnapshot(
                        new BigDecimal("597.737711"),
                        Instant.parse("2026-11-19T00:00:00Z"),
                        Instant.parse("2026-11-20T00:00:00Z")
                )
        );
    }

    @Test
    void convertsUsdTotalToWholeXafAndInitiatesHostedCheckout() throws Exception {
        when(order.getTotalAmount()).thenReturn(new BigDecimal("12.50"));
        when(fapshiApiClient.initiatePay(any())).thenReturn(
                new FapshiApiClient.InitiatePayResponse("https://pay.fapshi.com/checkout", "tx-27"));

        HostedPaymentService.Checkout checkout = hostedPaymentService.createCheckout(order);

        assertEquals(7472L, checkout.amountXaf());
        assertEquals("tx-27", checkout.transactionId());
        org.mockito.ArgumentCaptor<FapshiApiClient.InitiatePayRequest> captor =
                org.mockito.ArgumentCaptor.forClass(FapshiApiClient.InitiatePayRequest.class);
        verify(fapshiApiClient).initiatePay(captor.capture());
        FapshiApiClient.InitiatePayRequest request = captor.getValue();
        assertEquals(7472L, request.amount());
        assertNull(request.email());
        assertEquals("ORD-2026-ABC12345", request.externalId());
        assertEquals("order-27", request.userId());
        assertEquals("https://shop.example.test/?orderId=27", request.redirectUrl());
        assertFalse(new ObjectMapper().writeValueAsString(request).contains("\"email\""));
    }

    @Test
    void rejectsAmountsBelowFapshiMinimumBeforeCallingProvider() {
        when(order.getTotalAmount()).thenReturn(new BigDecimal("0.10"));

        assertThrows(HostedPaymentService.PaymentSetupException.class,
                () -> hostedPaymentService.createCheckout(order));

        verify(fapshiApiClient, never()).initiatePay(any());
    }

    @Test
    void rejectsCheckoutRedirectsOutsideFapshiHttpsHosts() {
        when(order.getTotalAmount()).thenReturn(new BigDecimal("12.50"));
        when(fapshiApiClient.initiatePay(any())).thenReturn(
                new FapshiApiClient.InitiatePayResponse("http://attacker.example/checkout", "tx-27"));

        assertThrows(HostedPaymentService.PaymentSetupException.class,
                () -> hostedPaymentService.createCheckout(order));
    }
}
