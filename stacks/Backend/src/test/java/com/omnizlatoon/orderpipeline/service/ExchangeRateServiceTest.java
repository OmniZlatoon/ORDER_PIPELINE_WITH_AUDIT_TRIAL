package com.omnizlatoon.orderpipeline.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ExchangeRateServiceTest {
    @Test
    void readsAndCachesTheXafRateAndProviderUpdateTime() {
        String url = "https://rates.example.test/v6/latest/USD";
        long updatedAt = Instant.now().minusSeconds(30).getEpochSecond();
        long nextUpdate = Instant.now().plusSeconds(3600).getEpochSecond();
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(url))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "result": "success",
                          "time_last_update_unix": %d,
                          "time_next_update_unix": %d,
                          "rates": { "XAF": 597.737711 }
                        }
                        """.formatted(updatedAt, nextUpdate), MediaType.APPLICATION_JSON));
        ExchangeRateService exchangeRateService = new ExchangeRateService(builder.build(), url);

        ExchangeRateService.RateSnapshot firstRate = exchangeRateService.getUsdToXafRate();
        ExchangeRateService.RateSnapshot cachedRate = exchangeRateService.getUsdToXafRate();

        assertEquals(new BigDecimal("597.737711"), firstRate.usdToXaf());
        assertEquals(Instant.ofEpochSecond(updatedAt), firstRate.lastUpdated());
        assertEquals(firstRate, cachedRate);
        server.verify();
    }

    @Test
    void usesFallbackProviderWhenPrimaryReturnsInvalidData() {
        String primaryUrl = "https://primary.example.test/v6/latest/USD";
        String fallbackUrl = "https://fallback.example.test/v1/currencies/usd.json";
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(primaryUrl))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "result": "error",
                          "rates": {}
                        }
                        """, MediaType.APPLICATION_JSON));
        server.expect(requestTo(fallbackUrl))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "date": "%s",
                          "usd": { "xaf": 597.07058688 }
                        }
                        """.formatted(LocalDate.now(ZoneOffset.UTC)), MediaType.APPLICATION_JSON));
        ExchangeRateService exchangeRateService =
                new ExchangeRateService(builder.build(), primaryUrl, fallbackUrl);

        ExchangeRateService.RateSnapshot rate = exchangeRateService.getUsdToXafRate();

        assertEquals(new BigDecimal("597.07058688"), rate.usdToXaf());
        assertEquals(LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC), rate.lastUpdated());
        server.verify();
    }

    @Test
    void acceptsRecentPrimaryRateWhenItsScheduledDailyRefreshIsLate() {
        String url = "https://rates.example.test/v6/latest/USD";
        long updatedAt = Instant.now().minusSeconds(29 * 60 * 60).getEpochSecond();
        long missedUpdate = Instant.now().minusSeconds(4 * 60 * 60).getEpochSecond();
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(url))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "result": "success",
                          "time_last_update_unix": %d,
                          "time_next_update_unix": %d,
                          "rates": { "XAF": 597.416002 }
                        }
                        """.formatted(updatedAt, missedUpdate), MediaType.APPLICATION_JSON));
        ExchangeRateService exchangeRateService = new ExchangeRateService(builder.build(), url);

        ExchangeRateService.RateSnapshot rate = exchangeRateService.getUsdToXafRate();

        assertEquals(new BigDecimal("597.416002"), rate.usdToXaf());
        assertEquals(Instant.ofEpochSecond(updatedAt), rate.lastUpdated());
        assertTrue(rate.nextUpdate().isAfter(Instant.now()));
        server.verify();
    }

    @Test
    void scheduledRefreshChecksProviderEvenWhenCurrentCacheHasNotExpired() {
        String url = "https://rates.example.test/v6/latest/USD";
        long updatedAt = Instant.now().minusSeconds(10).getEpochSecond();
        long nextUpdate = Instant.now().plusSeconds(3600).getEpochSecond();
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(url))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "result": "success",
                          "time_last_update_unix": %d,
                          "time_next_update_unix": %d,
                          "rates": { "XAF": 598.125 }
                        }
                        """.formatted(updatedAt, nextUpdate), MediaType.APPLICATION_JSON));
        ExchangeRateService exchangeRateService = new ExchangeRateService(builder.build(), url);
        ReflectionTestUtils.setField(exchangeRateService, "cachedRate", new ExchangeRateService.RateSnapshot(
                new BigDecimal("597.25"),
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(1800)
        ));

        ExchangeRateService.RateSnapshot refreshed = exchangeRateService.refreshUsdToXafRate();

        assertEquals(new BigDecimal("598.125"), refreshed.usdToXaf());
        server.verify();
    }

    @Test
    void usesRecentCachedRateWhenBothProvidersAreUnavailable() {
        String primaryUrl = "https://primary.example.test/v6/latest/USD";
        String fallbackUrl = "https://fallback.example.test/v1/currencies/usd.json";
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(primaryUrl))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withServerError());
        server.expect(requestTo(fallbackUrl))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withServerError());
        ExchangeRateService exchangeRateService =
                new ExchangeRateService(builder.build(), primaryUrl, fallbackUrl);
        Instant lastUpdated = Instant.now().minusSeconds(35 * 60 * 60);
        ExchangeRateService.RateSnapshot cachedRate = new ExchangeRateService.RateSnapshot(
                new BigDecimal("597.25"),
                lastUpdated,
                Instant.now().minusSeconds(1)
        );
        ReflectionTestUtils.setField(exchangeRateService, "cachedRate", cachedRate);

        ExchangeRateService.RateSnapshot result = exchangeRateService.getUsdToXafRate();

        assertEquals(cachedRate.usdToXaf(), result.usdToXaf());
        assertEquals(cachedRate.lastUpdated(), result.lastUpdated());
        assertEquals(new BigDecimal("597.25"), result.usdToXaf());
        server.verify();
    }

    @Test
    void rejectsCachedRateOlderThanMaximumAgeWhenBothProvidersAreUnavailable() {
        String primaryUrl = "https://primary.example.test/v6/latest/USD";
        String fallbackUrl = "https://fallback.example.test/v1/currencies/usd.json";
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo(primaryUrl)).andRespond(withServerError());
        server.expect(requestTo(fallbackUrl)).andRespond(withServerError());
        ExchangeRateService exchangeRateService =
                new ExchangeRateService(builder.build(), primaryUrl, fallbackUrl);
        ReflectionTestUtils.setField(exchangeRateService, "cachedRate", new ExchangeRateService.RateSnapshot(
                new BigDecimal("597.25"),
                Instant.now().minusSeconds(37 * 60 * 60),
                Instant.now().minusSeconds(1)
        ));

        assertThrows(ExchangeRateService.ExchangeRateUnavailableException.class,
                exchangeRateService::getUsdToXafRate);
        server.verify();
    }
}
