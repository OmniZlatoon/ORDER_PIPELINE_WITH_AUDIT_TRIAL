import { useCallback, useEffect, useState } from 'react';
import { fetchOrderById } from '../api/orderApi';
import { extractApiError } from '../api/axiosClient';

export function useOrder(orderId, initialOrder = null) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(orderId);
      setOrder(data);
    } catch (err) {
      const normalized = extractApiError(err, 'Unable to load order details.');
      setError(normalized.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  return { order, loading, error, refetch: loadOrder };
}
