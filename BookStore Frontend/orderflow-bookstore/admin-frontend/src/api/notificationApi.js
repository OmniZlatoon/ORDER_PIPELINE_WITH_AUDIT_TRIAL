import axiosClient from './axiosClient';

/**
 * Fetch read-only shipping and email observer notification outcomes (GET /api/orders/{orderId}/notifications).
 */
export async function fetchOrderNotifications(orderId) {
  const response = await axiosClient.get(`/api/orders/${encodeURIComponent(orderId)}/notifications`);
  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.notifications)) {
    return payload.notifications;
  }
  if (payload && Array.isArray(payload.content)) {
    return payload.content;
  }
  return [];
}
