package com.omnizlatoon.orderpipeline.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExchangeRateRefreshScheduler {
    private static final Logger logger = LoggerFactory.getLogger(ExchangeRateRefreshScheduler.class);

    private final ExchangeRateService exchangeRateService;

    public ExchangeRateRefreshScheduler(ExchangeRateService exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }

    @Scheduled(initialDelay = 60_000L, fixedDelay = 6 * 60 * 60 * 1000L)
    public void refreshRate() {
        try {
            ExchangeRateService.RateSnapshot rate = exchangeRateService.refreshUsdToXafRate();
            logger.info("USD/XAF refresh check completed; provider data is dated {}", rate.lastUpdated());
        } catch (ExchangeRateService.ExchangeRateUnavailableException exception) {
            logger.error("Scheduled USD/XAF refresh failed: {}", exception.getClass().getSimpleName());
        }
    }
}
