import { useCallback, useEffect, useState } from 'react';
import { fetchOrderAuditHistory } from '../api/auditApi';
import { extractApiError } from '../api/axiosClient';

export function useAuditHistory(orderId) {
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(null);

  const loadAuditHistory = useCallback(async () => {
    if (!orderId) {
      setAuditEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const records = await fetchOrderAuditHistory(orderId);
      const sorted = [...records].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return (Number(a.auditId) || 0) - (Number(b.auditId) || 0);
      });
      setAuditEvents(sorted);
    } catch (err) {
      const normalized = extractApiError(err, 'Unable to load activity history for this order.');
      setError(normalized.message);
      setAuditEvents([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadAuditHistory();
  }, [loadAuditHistory]);

  return { auditEvents, loading, error, refetch: loadAuditHistory };
}
