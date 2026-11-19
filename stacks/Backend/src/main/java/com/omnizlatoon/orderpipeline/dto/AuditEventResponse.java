package com.omnizlatoon.orderpipeline.dto;

import com.omnizlatoon.orderpipeline.entity.AuditLog;

import java.time.LocalDateTime;

public record AuditEventResponse(
        Long auditId,
        String stepName,
        String executionStatus,
        String message,
        LocalDateTime createdAt
) {
    public static AuditEventResponse from(AuditLog auditLog) {
        return new AuditEventResponse(
                auditLog.getId(),
                auditLog.getStepName(),
                auditLog.getExecutionStatus().name(),
                auditLog.getMessage(),
                auditLog.getCreatedAt()
        );
    }
}
