import { useCallback, useEffect, useState } from 'react';
import { extractApiError } from '../api/axiosClient';
import { fetchBooks } from '../api/bookApi';

export function useBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch (err) {
      const normalized = extractApiError(err, 'Unable to load the book inventory right now.');
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
