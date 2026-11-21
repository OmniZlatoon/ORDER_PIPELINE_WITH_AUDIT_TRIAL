import axiosClient from './axiosClient';

/**
 * Submit a new customer order; the backend validates inventory and computes authoritative prices.
 */
export async function createOrder(orderPayload) {
  const response = await axiosClient.post('/api/orders', orderPayload);
  return response.data;
}

/**
 * Fetch order summary by numeric order ID (GET /api/orders/{orderId}).
 */
export async function fetchOrderById(orderId) {
  const response = await axiosClient.get(`/api/orders/${encodeURIComponent(orderId)}`);
  return response.data;
}

export async function reconcilePayment(orderId) {
  const response = await axiosClient.post(
    `/api/orders/${encodeURIComponent(orderId)}/reconcile-payment`
  );
  return response.data;
}

/**
 * Look up an order by numeric ID or its public order reference.
 */
export async function lookupOrder(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    throw new Error('Please enter an Order ID or Order Reference.');
  }

  if (/^\d+$/.test(trimmed)) {
    return fetchOrderById(trimmed);
  }

  const response = await axiosClient.get(
    `/api/orders/reference/${encodeURIComponent(trimmed)}`
  );
  return response.data;
}
