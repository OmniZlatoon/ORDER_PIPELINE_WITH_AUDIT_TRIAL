package com.omnizlatoon.orderpipeline.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;

@Service
public class ExchangeRateService {
    private static final Logger logger = LoggerFactory.getLogger(ExchangeRateService.class);
    private static final Duration MAX_STALE_AGE = Duration.ofHours(24);

    private final RestClient restClient;
    private final String url;
    private volatile RateSnapshot cachedRate;

    @Autowired
    public ExchangeRateService(
            RestClient.Builder builder,
            @Value("${app.exchange-rate.url:https://open.er-api.com/v6/latest/USD}") String url
    ) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = builder.requestFactory(requestFactory).build();
        this.url = url;
    }

    ExchangeRateService(RestClient restClient, String url) {
        this.restClient = restClient;
        this.url = url;
    }

    public RateSnapshot getUsdToXafRate() {
        Instant now = Instant.now();
        RateSnapshot current = cachedRate;
        if (current != null && now.isBefore(current.nextUpdate())) {
            return current;
        }

        try {
            ExchangeRateResponse response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(ExchangeRateResponse.class);
            if (response == null || !"success".equals(response.result())
                    || response.rates() == null || response.rates().xaf() == null
                    || response.rates().xaf().signum() <= 0
                    || response.timeNextUpdate() == null) {
                throw new ExchangeRateUnavailableException("Exchange-rate service returned invalid USD/XAF data");
            }
            RateSnapshot refreshed = new RateSnapshot(
                    response.rates().xaf(),
                    response.timeLastUpdate() == null ? now : response.timeLastUpdate(),
                    response.timeNextUpdate()
            );
            if (!now.isBefore(refreshed.nextUpdate())) {
                throw new ExchangeRateUnavailableException("Exchange-rate service returned stale USD/XAF data");
            }
            cachedRate = refreshed;
            return refreshed;
        } catch (RestClientException exception) {
            if (current != null && Duration.between(current.lastUpdated(), now).compareTo(MAX_STALE_AGE) <= 0) {
                logger.warn("Exchange-rate service is unavailable; using the last rate updated at {}",
                        current.lastUpdated());
                return current;
            }
            throw new ExchangeRateUnavailableException("Exchange-rate service is temporarily unavailable", exception);
        }
    }

    public record RateSnapshot(BigDecimal usdToXaf, Instant lastUpdated, Instant nextUpdate) {
    }

    private record ExchangeRateResponse(
            String result,
            ExchangeRates rates,
            @JsonProperty("time_last_update_unix") Long timeLastUpdateUnix,
            @JsonProperty("time_next_update_unix") Long timeNextUpdateUnix
    ) {
        private Instant timeLastUpdate() {
            return timeLastUpdateUnix == null ? null : Instant.ofEpochSecond(timeLastUpdateUnix);
        }

        private Instant timeNextUpdate() {
            return timeNextUpdateUnix == null ? null : Instant.ofEpochSecond(timeNextUpdateUnix);
        }
    }

    private record ExchangeRates(@JsonProperty("XAF") BigDecimal xaf) {
    }

    public static class ExchangeRateUnavailableException extends RuntimeException {
        public ExchangeRateUnavailableException(String message) {
            super(message);
        }

        public ExchangeRateUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
