import { useCallback, useEffect, useState } from 'react';
import { fetchBooks } from '../api/bookApi';
import { extractApiError } from '../api/axiosClient';

export function useBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBooks();
      setBooks(result);
    } catch (err) {
      const normalized = extractApiError(err, 'Unable to load the book catalogue right now.');
      setError(normalized.message);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  return { books, loading, error, refetch: loadBooks };
}
