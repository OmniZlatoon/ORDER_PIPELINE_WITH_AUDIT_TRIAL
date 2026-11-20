package com.omnizlatoon.orderpipeline.service;

import com.omnizlatoon.orderpipeline.entity.AuditExecutionStatus;
import com.omnizlatoon.orderpipeline.entity.AuditLog;
import com.omnizlatoon.orderpipeline.entity.Order;
import com.omnizlatoon.orderpipeline.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Order order, String stepName, AuditExecutionStatus status, String message) {
        auditLogRepository.save(new AuditLog(order, stepName.toUpperCase(Locale.ROOT), status, message));
    }
}
