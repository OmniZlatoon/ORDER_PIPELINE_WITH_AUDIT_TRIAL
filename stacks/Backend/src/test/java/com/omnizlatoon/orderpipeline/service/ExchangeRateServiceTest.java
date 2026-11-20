package com.omnizlatoon.orderpipeline.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
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
}
