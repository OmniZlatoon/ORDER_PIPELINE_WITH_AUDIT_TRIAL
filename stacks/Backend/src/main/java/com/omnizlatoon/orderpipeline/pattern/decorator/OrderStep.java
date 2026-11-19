package com.omnizlatoon.orderpipeline.pattern.decorator;

import com.omnizlatoon.orderpipeline.entity.Order;

@FunctionalInterface
public interface OrderStep {
    void execute(Order order);
}
