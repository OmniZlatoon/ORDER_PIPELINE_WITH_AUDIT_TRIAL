import axiosClient from './axiosClient';

/* ============================================================================
 * TEMPORARY TESTING SIMULATION — REMOVE BEFORE PRODUCTION BACKEND HANDOFF
 * Reads Admin-added test books & cover image overrides from local browser
 * storage so newly added books can feature in the Customer Book Catalogue.
 * ============================================================================ */
const TEST_BOOKS_KEY = 'orderflow_simulated_test_books_v1';
const TEST_BOOK_IMAGES_KEY = 'orderflow_simulated_book_images_v1';

function readTestBooks() {
  try {
    const raw = window.localStorage.getItem(TEST_BOOKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readTestImageMap() {
  try {
    const raw = window.localStorage.getItem(TEST_BOOK_IMAGES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function mergeBooksWithTestingStore(apiBooks) {
  const imageMap = readTestImageMap();
  const testBooks = readTestBooks();
  const seenIds = new Set();

  const mergedApi = apiBooks.map((book) => {
    const key = String(book.bookId);
    seenIds.add(key);
    const overrideImage = imageMap[key];
    return overrideImage && !book.imageUrl
      ? { ...book, imageUrl: overrideImage }
      : book;
  });

  const extraTestBooks = testBooks
    .filter((tb) => !seenIds.has(String(tb.bookId)))
    .map((tb) => {
      const overrideImage = imageMap[String(tb.bookId)];
      return overrideImage ? { ...tb, imageUrl: overrideImage } : tb;
    });

  return [...mergedApi, ...extraTestBooks];
}

/**
 * Fetch available books from GET /api/books
 * (merged with any temporary testing books & cover images added by the Admin).
 */
export async function fetchBooks() {
  try {
    const response = await axiosClient.get('/api/books');
    const payload = response.data;

    let apiBooks = [];
    if (Array.isArray(payload)) {
      apiBooks = payload;
    } else if (payload && Array.isArray(payload.books)) {
      apiBooks = payload.books;
    } else if (payload && Array.isArray(payload.content)) {
      apiBooks = payload.content;
    } else if (payload && Array.isArray(payload.data)) {
      apiBooks = payload.data;
    }

    return mergeBooksWithTestingStore(apiBooks);
  } catch (err) {
    // TEMPORARY TESTING FALLBACK: display Admin-added simulated books when server is offline
    const rawTestStore = window.localStorage.getItem(TEST_BOOKS_KEY);
    if (rawTestStore !== null) {
      const testBooks = readTestBooks();
      const imageMap = readTestImageMap();
      return testBooks.map((tb) => ({
        ...tb,
        imageUrl: imageMap[String(tb.bookId)] || tb.imageUrl || '',
      }));
    }
    throw err;
  }
}
