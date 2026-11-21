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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.Map;

@Service
public class ExchangeRateService {
    private static final Logger logger = LoggerFactory.getLogger(ExchangeRateService.class);
    private static final String DEFAULT_FALLBACK_URL =
            "https://latest.currency-api.pages.dev/v1/currencies/usd.json";
    private static final Duration MAX_RATE_AGE = Duration.ofHours(36);
    private static final Duration RETRY_INTERVAL = Duration.ofMinutes(5);

    private final RestClient restClient;
    private final String url;
    private final String fallbackUrl;
    private volatile RateSnapshot cachedRate;

    @Autowired
    public ExchangeRateService(
            RestClient.Builder builder,
            @Value("${app.exchange-rate.url:https://open.er-api.com/v6/latest/USD}") String url,
            @Value("${app.exchange-rate.fallback-url:https://latest.currency-api.pages.dev/v1/currencies/usd.json}")
            String fallbackUrl
    ) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = builder.requestFactory(requestFactory).build();
        this.url = url;
        this.fallbackUrl = fallbackUrl;
    }

    ExchangeRateService(RestClient restClient, String url) {
        this(restClient, url, DEFAULT_FALLBACK_URL);
    }

    ExchangeRateService(RestClient restClient, String url, String fallbackUrl) {
        this.restClient = restClient;
        this.url = url;
        this.fallbackUrl = fallbackUrl;
    }

    public RateSnapshot getUsdToXafRate() {
        Instant now = Instant.now();
        RateSnapshot current = cachedRate;
        if (isUsable(current, now) && now.isBefore(current.nextUpdate())) {
            return current;
        }

        return refreshRate(now, current);
    }

    public RateSnapshot refreshUsdToXafRate() {
        return refreshRate(Instant.now(), cachedRate);
    }

    private RateSnapshot refreshRate(Instant now, RateSnapshot current) {
        try {
            RateSnapshot refreshed = readOpenExchangeRate(now);
            cachedRate = refreshed;
            return refreshed;
        } catch (RestClientException | ExchangeRateUnavailableException primaryFailure) {
            logger.warn("Primary exchange-rate provider failed: {}", primaryFailure.getClass().getSimpleName());
            try {
                RateSnapshot refreshed = readDailyFallbackRate(now);
                cachedRate = refreshed;
                return refreshed;
            } catch (RestClientException | ExchangeRateUnavailableException fallbackFailure) {
                logger.warn("Fallback exchange-rate provider failed: {}",
                        fallbackFailure.getClass().getSimpleName());
                if (isUsable(current, now)) {
                    logger.warn("Both exchange-rate providers failed; using cached rate updated at {}",
                            current.lastUpdated());
                    RateSnapshot retryable = deferRetry(current, now);
                    cachedRate = retryable;
                    return retryable;
                }
                ExchangeRateUnavailableException unavailable = new ExchangeRateUnavailableException(
                        "Exchange-rate providers are unavailable and no recent USD/XAF rate is cached",
                        fallbackFailure
                );
                unavailable.addSuppressed(primaryFailure);
                throw unavailable;
            }
        }
    }

    private RateSnapshot readOpenExchangeRate(Instant now) {
        ExchangeRateResponse response = restClient.get()
                .uri(url)
                .retrieve()
                .body(ExchangeRateResponse.class);
        if (response == null || !"success".equals(response.result())
                || response.rates() == null || response.rates().xaf() == null
                || response.timeLastUpdate() == null) {
            throw new ExchangeRateUnavailableException("Primary provider returned invalid USD/XAF data");
        }
        return createSnapshot(
                response.rates().xaf(),
                response.timeLastUpdate(),
                response.timeNextUpdate(),
                now
        );
    }

    private RateSnapshot readDailyFallbackRate(Instant now) {
        DailyExchangeRateResponse response = restClient.get()
                .uri(fallbackUrl)
                .retrieve()
                .body(DailyExchangeRateResponse.class);
        if (response == null || response.date() == null || response.usd() == null
                || response.usd().get("xaf") == null) {
            throw new ExchangeRateUnavailableException("Fallback provider returned invalid USD/XAF data");
        }
        Instant updatedAt;
        try {
            updatedAt = LocalDate.parse(response.date()).atStartOfDay().toInstant(ZoneOffset.UTC);
        } catch (DateTimeParseException exception) {
            throw new ExchangeRateUnavailableException("Fallback provider returned an invalid update date", exception);
        }
        return createSnapshot(response.usd().get("xaf"), updatedAt, updatedAt.plus(Duration.ofDays(1)), now);
    }

    private RateSnapshot createSnapshot(
            BigDecimal rate,
            Instant updatedAt,
            Instant providerNextUpdate,
            Instant now
    ) {
        Duration age = Duration.between(updatedAt, now);
        if (rate == null || rate.signum() <= 0 || age.isNegative() || age.compareTo(MAX_RATE_AGE) > 0) {
            throw new ExchangeRateUnavailableException("Provider returned invalid or stale USD/XAF data");
        }
        Instant expiresAt = updatedAt.plus(MAX_RATE_AGE);
        Instant retryAt = providerNextUpdate != null && providerNextUpdate.isAfter(now)
                ? providerNextUpdate
                : now.plus(RETRY_INTERVAL);
        if (retryAt.isAfter(expiresAt)) {
            retryAt = expiresAt;
        }
        return new RateSnapshot(rate, updatedAt, retryAt);
    }

    private boolean isUsable(RateSnapshot rate, Instant now) {
        if (rate == null) {
            return false;
        }
        Duration age = Duration.between(rate.lastUpdated(), now);
        return !age.isNegative() && age.compareTo(MAX_RATE_AGE) <= 0;
    }

    private RateSnapshot deferRetry(RateSnapshot current, Instant now) {
        Instant retryAt = now.plus(RETRY_INTERVAL);
        Instant expiresAt = current.lastUpdated().plus(MAX_RATE_AGE);
        if (retryAt.isAfter(expiresAt)) {
            retryAt = expiresAt;
        }
        return new RateSnapshot(current.usdToXaf(), current.lastUpdated(), retryAt);
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

    private record DailyExchangeRateResponse(String date, Map<String, BigDecimal> usd) {
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
