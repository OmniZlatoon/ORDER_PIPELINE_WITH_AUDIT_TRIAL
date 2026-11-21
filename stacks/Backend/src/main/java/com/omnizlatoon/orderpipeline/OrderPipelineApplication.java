package com.omnizlatoon.orderpipeline;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OrderPipelineApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderPipelineApplication.class, args);
    }
}
