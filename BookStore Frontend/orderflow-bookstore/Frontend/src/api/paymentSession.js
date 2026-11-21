export function paymentLinkStorageKey(orderId) {
  return `orderflow_fapshi_payment_link_${orderId}`;
}

export function paymentReturnStorageKey(orderId) {
  return `orderflow_fapshi_payment_return_${orderId}`;
}
