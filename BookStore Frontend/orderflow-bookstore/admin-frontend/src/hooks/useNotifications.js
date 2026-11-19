import { useCallback, useEffect, useState } from 'react';
import { extractApiError } from '../api/axiosClient';
import { fetchOrderNotifications } from '../api/notificationApi';

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
      const normalized = extractApiError(err, `Unable to retrieve notifications for order #${orderId}.`);
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
