const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot reach the order service. Check that the backend is running.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail ?? body?.message ?? `Request failed (${response.status})`);
  }
  return body;
}

export function getBooks() {
  return request("/api/books");
}

export function createOrder(order) {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export function reconcilePayment(orderId) {
  return request(`/api/orders/${orderId}/reconcile-payment`, { method: "POST" });
}

export function getOrderAudit(orderId) {
  return request(`/api/orders/${orderId}/audit`);
}

export function getOrderNotifications(orderId) {
  return request(`/api/orders/${orderId}/notifications`);
}
