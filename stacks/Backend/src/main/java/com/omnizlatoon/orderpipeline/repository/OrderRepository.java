package com.omnizlatoon.orderpipeline.repository;

import com.omnizlatoon.orderpipeline.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
