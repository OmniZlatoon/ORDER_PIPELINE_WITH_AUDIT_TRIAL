package com.omnizlatoon.orderpipeline.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class FapshiApiClient {
    private final RestClient restClient;

    public FapshiApiClient(
            RestClient.Builder builder,
            @Value("${app.fapshi.base-url:https://sandbox.fapshi.com}") String baseUrl,
            @Value("${app.fapshi.api-user:}") String apiUser,
            @Value("${app.fapshi.api-secret:}") String apiSecret
    ) {
        URI baseUri = URI.create(baseUrl);
        if (!"https".equalsIgnoreCase(baseUri.getScheme()) || baseUri.getHost() == null) {
            throw new IllegalArgumentException("Fapshi base URL must use HTTPS");
        }

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(8));

        this.restClient = builder
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("apiuser", apiUser)
                .defaultHeader("apikey", apiSecret)
                .build();
    }

    public InitiatePayResponse initiatePay(InitiatePayRequest request) {
        InitiatePayResponse response = restClient.post()
                .uri("/initiate-pay")
                .body(request)
                .retrieve()
                .body(InitiatePayResponse.class);
        if (response == null || response.link() == null || response.transId() == null) {
            throw new IllegalStateException("Fapshi returned an incomplete checkout response");
        }
        return response;
    }

    public TransactionStatusResponse getPaymentStatus(String transactionId) {
        TransactionStatusResponse response = restClient.get()
                .uri("/payment-status/{transId}", transactionId)
                .retrieve()
                .body(TransactionStatusResponse.class);
        if (response == null || response.transId() == null || response.status() == null) {
            throw new IllegalStateException("Fapshi returned an incomplete transaction status");
        }
        return response;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record InitiatePayRequest(
            long amount,
            String email,
            String redirectUrl,
            String userId,
            String externalId,
            String message
    ) {
    }

    public record InitiatePayResponse(String link, String transId) {
    }

    public record TransactionStatusResponse(
            String transId,
            String status,
            Long amount,
            String externalId
    ) {
    }
}
