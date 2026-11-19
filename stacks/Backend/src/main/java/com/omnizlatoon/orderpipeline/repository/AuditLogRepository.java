package com.omnizlatoon.orderpipeline.repository;

import com.omnizlatoon.orderpipeline.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @Query("""
            select audit from AuditLog audit
            where audit.order.id = :orderId
            order by audit.createdAt, audit.id
            """)
    List<AuditLog> findTimelineByOrderId(@Param("orderId") Long orderId);
}
