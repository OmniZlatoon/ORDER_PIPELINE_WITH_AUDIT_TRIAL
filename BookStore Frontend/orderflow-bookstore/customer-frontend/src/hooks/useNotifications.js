import { useCallback, useEffect, useState } from 'react';
import { fetchOrderNotifications } from '../api/auditApi';
import { extractApiError } from '../api/axiosClient';

export function useNotifications(orderId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    if (!orderId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const records = await fetchOrderNotifications(orderId);
      setNotifications(records);
    } catch (err) {
      const normalized = extractApiError(err, 'Unable to load shipping and email notifications for this order.');
      setError(normalized.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return { notifications, loading, error, refetch: loadNotifications };
}
