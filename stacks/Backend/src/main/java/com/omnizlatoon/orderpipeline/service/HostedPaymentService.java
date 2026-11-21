package com.omnizlatoon.orderpipeline.service;

import com.omnizlatoon.orderpipeline.entity.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;

@Service
public class HostedPaymentService {
    private static final Logger logger = LoggerFactory.getLogger(HostedPaymentService.class);
    private static final BigDecimal MINIMUM_AMOUNT_XAF = BigDecimal.valueOf(100);

    private final FapshiApiClient fapshiApiClient;
    private final ExchangeRateService exchangeRateService;
    private final String frontendBaseUrl;

    public HostedPaymentService(
            FapshiApiClient fapshiApiClient,
            ExchangeRateService exchangeRateService,
            @Value("${app.frontend.base-url:https://subtarsal-kathyrn-untreated.ngrok-free.dev}") String frontendBaseUrl
    ) {
        this.fapshiApiClient = fapshiApiClient;
        this.exchangeRateService = exchangeRateService;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
    }

    public Checkout createCheckout(Order order) {
        try {
            ExchangeRateService.RateSnapshot rate = exchangeRateService.getUsdToXafRate();
            long amountXaf;
            try {
                amountXaf = order.getTotalAmount()
                        .multiply(rate.usdToXaf())
                        .setScale(0, RoundingMode.HALF_UP)
                        .longValueExact();
            } catch (ArithmeticException exception) {
                throw new PaymentSetupException("The converted order total exceeds Fapshi's payment limit.", exception);
            }
            if (amountXaf < MINIMUM_AMOUNT_XAF.longValueExact()) {
                throw new PaymentSetupException("The converted order total is below Fapshi's minimum of 100 XAF.");
            }

            String redirectUrl = frontendBaseUrl + "/?orderId=" + order.getId();
            FapshiApiClient.InitiatePayResponse response = fapshiApiClient.initiatePay(
                    new FapshiApiClient.InitiatePayRequest(
                            amountXaf,
                            null,
                            redirectUrl,
                            "order-" + order.getId(),
                            order.getOrderReference(),
                            "Order " + order.getOrderReference()
                    )
            );
            validateCheckoutLink(response.link());
            return new Checkout(
                    response.transId(),
                    response.link(),
                    amountXaf,
                    rate.usdToXaf()
            );
        } catch (ExchangeRateService.ExchangeRateUnavailableException exception) {
            throw new PaymentSetupException(
                    "The live USD/XAF exchange rate is unavailable. No payment was initiated.", exception);
        } catch (RestClientResponseException exception) {
            logger.warn("Fapshi checkout initialization returned HTTP {}", exception.getStatusCode().value());
            if (exception.getStatusCode().is4xxClientError()) {
                throw new PaymentSetupException(
                        "Fapshi rejected the checkout request. Please check the order and try again.", exception);
            }
            throw new PaymentInitiationUncertainException(
                    "Fapshi did not confirm checkout creation. Please do not retry until the transaction is reconciled.",
                    exception);
        } catch (RestClientException | IllegalStateException exception) {
            logger.warn("Fapshi checkout initialization failed: {}", exception.getClass().getSimpleName());
            throw new PaymentInitiationUncertainException(
                    "Fapshi did not confirm checkout creation. Please do not retry until the transaction is reconciled.",
                    exception);
        }
    }

    private void validateCheckoutLink(String link) {
        URI uri;
        try {
            uri = URI.create(link);
        } catch (IllegalArgumentException exception) {
            throw new PaymentSetupException("Fapshi returned an invalid checkout link.", exception);
        }
        String host = uri.getHost();
        if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null
                || !(host.equals("fapshi.com") || host.endsWith(".fapshi.com"))) {
            throw new PaymentSetupException("Fapshi returned an unsafe checkout link.");
        }
    }

    public record Checkout(
            String transactionId,
            String paymentLink,
            long amountXaf,
            BigDecimal exchangeRate
    ) {
    }

    public static class PaymentSetupException extends RuntimeException {
        public PaymentSetupException(String message) {
            super(message);
        }

        public PaymentSetupException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class PaymentInitiationUncertainException extends RuntimeException {
        public PaymentInitiationUncertainException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
