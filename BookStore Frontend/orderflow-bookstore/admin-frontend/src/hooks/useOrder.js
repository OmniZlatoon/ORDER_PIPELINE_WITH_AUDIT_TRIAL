import { useCallback, useEffect, useState } from 'react';
import { extractApiError } from '../api/axiosClient';
import { fetchOrderById } from '../api/orderApi';

export function useOrder(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(orderId);
      setOrder(data);
    } catch (err) {
      const normalized = extractApiError(err, `Unable to retrieve order #${orderId}.`);
      setError(normalized.message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  return { order, loading, error, refetch: loadOrder };
}
