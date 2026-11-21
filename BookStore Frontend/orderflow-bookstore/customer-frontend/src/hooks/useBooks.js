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

  // TEMPORARY TESTING SYNC: refresh customer catalogue if Admin updates simulated books in another tab
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.key === 'orderflow_simulated_test_books_v1'
        || event.key === 'orderflow_simulated_book_images_v1'
      ) {
        loadBooks();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadBooks]);

  return { books, loading, error, refetch: loadBooks };
}
