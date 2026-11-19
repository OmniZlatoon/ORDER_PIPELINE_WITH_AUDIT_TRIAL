package com.omnizlatoon.orderpipeline.repository;

import com.omnizlatoon.orderpipeline.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
