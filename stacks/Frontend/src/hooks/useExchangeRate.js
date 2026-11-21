import { useCallback, useEffect, useState } from 'react';
import { fetchUsdToXafRate } from '../api/exchangeRateApi';
import { extractApiError } from '../api/axiosClient';

export function useExchangeRate() {
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadExchangeRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setExchangeRate(await fetchUsdToXafRate());
    } catch (err) {
      const normalized = extractApiError(err, 'Unable to load the USD/XAF exchange rate.');
      setError(normalized.message);
      setExchangeRate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExchangeRate();
  }, [loadExchangeRate]);

  return { exchangeRate, loading, error, refetch: loadExchangeRate };
}
