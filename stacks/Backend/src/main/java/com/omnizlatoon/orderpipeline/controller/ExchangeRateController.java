package com.omnizlatoon.orderpipeline.controller;

import com.omnizlatoon.orderpipeline.dto.UsdXafExchangeRateResponse;
import com.omnizlatoon.orderpipeline.service.ExchangeRateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exchange-rate")
public class ExchangeRateController {
    private final ExchangeRateService exchangeRateService;

    public ExchangeRateController(ExchangeRateService exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }

    @GetMapping("/usd-xaf")
    public UsdXafExchangeRateResponse getUsdToXafRate() {
        ExchangeRateService.RateSnapshot snapshot = exchangeRateService.getUsdToXafRate();
        return new UsdXafExchangeRateResponse("USD", "XAF", snapshot.usdToXaf(), snapshot.lastUpdated());
    }
}
