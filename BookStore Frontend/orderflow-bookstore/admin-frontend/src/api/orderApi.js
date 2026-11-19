import axiosClient from './axiosClient';

/**
 * Retrieve orders overview from GET /api/orders (if exposed by the Spring Boot backend).
 */
export async function fetchOrders(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
  const response = await axiosClient.get('/api/orders', { params: cleanParams });
  const payload = response.data;

  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.content)) {
    return payload.content;
  }
  if (payload && Array.isArray(payload.orders)) {
    return payload.orders;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

/**
 * Retrieve order summary by numeric order ID (GET /api/orders/{orderId}).
 */
export async function fetchOrderById(orderId) {
  const response = await axiosClient.get(`/api/orders/${encodeURIComponent(orderId)}`);
  return response.data;
}

/**
 * Resolve an order by either numeric orderId or orderReference (e.g. ORD-2026-00104).
 */
export async function lookupOrder(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    throw new Error('Please enter an Order ID or Order Reference.');
  }

  if (/^\d+$/.test(trimmed)) {
    return fetchOrderById(trimmed);
  }

  try {
    const byReference = await axiosClient.get(`/api/orders/reference/${encodeURIComponent(trimmed)}`);
    if (byReference.data && byReference.data.orderId) {
      return byReference.data;
    }
  } catch (err) {
    if (err.response && err.response.status !== 404 && err.response.status !== 405) {
      throw err;
    }
  }

  try {
    const direct = await axiosClient.get(`/api/orders/${encodeURIComponent(trimmed)}`);
    if (direct.data && direct.data.orderId) {
      return direct.data;
    }
  } catch (err) {
    if (err.response && err.response.status !== 404 && err.response.status !== 400) {
      throw err;
    }
  }

  const orders = await fetchOrders({ orderReference: trimmed });
  const matched = orders.find(
    (item) => String(item.orderReference || '').toLowerCase() === trimmed.toLowerCase()
      || String(item.orderId) === trimmed
  );

  if (matched) {
    return matched;
  }

  const notFound = new Error(`No order found matching "${trimmed}".`);
  notFound.response = { status: 404, data: { message: `No order found matching "${trimmed}".` } };
  throw notFound;
}
