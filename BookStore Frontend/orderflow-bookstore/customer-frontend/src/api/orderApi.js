import axiosClient from './axiosClient';

/**
 * Submit a new customer order to POST /api/orders.
 * The backend validates items, checks stock, calculates authoritative totals from MySQL,
 * processes payment, confirms/completes the order, records audit trails, and triggers observers.
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

/**
 * Look up an order by either numeric orderId or orderReference (e.g. ORD-2026-00104).
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

  const listResponse = await axiosClient.get('/api/orders', {
    params: { orderReference: trimmed },
  });
  const listData = listResponse.data;
  const orders = Array.isArray(listData)
    ? listData
    : Array.isArray(listData?.content)
      ? listData.content
      : Array.isArray(listData?.orders)
        ? listData.orders
        : [];

  const matched = orders.find(
    (item) => String(item.orderReference || '').toLowerCase() === trimmed.toLowerCase()
      || String(item.orderId) === trimmed
  );

  if (matched) {
    return matched;
  }

  const notFoundError = new Error(`No order found matching "${trimmed}".`);
  notFoundError.response = { status: 404, data: { message: `No order found matching "${trimmed}".` } };
  throw notFoundError;
}
