import axiosClient from './axiosClient';

/**
 * Fetch chronological read-only audit records for an order (GET /api/orders/{orderId}/audit).
 */
export async function fetchOrderAuditHistory(orderId) {
  const response = await axiosClient.get(`/api/orders/${encodeURIComponent(orderId)}/audit`);
  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.auditLogs)) {
    return payload.auditLogs;
  }
  if (payload && Array.isArray(payload.content)) {
    return payload.content;
  }
  return [];
}
