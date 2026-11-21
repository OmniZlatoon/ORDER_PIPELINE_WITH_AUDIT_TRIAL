package com.omnizlatoon.orderpipeline.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record UsdXafExchangeRateResponse(
        String baseCurrency,
        String quoteCurrency,
        BigDecimal rate,
        Instant updatedAt
) {
}
