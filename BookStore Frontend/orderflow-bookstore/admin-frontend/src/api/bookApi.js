import axiosClient from './axiosClient';

/* ============================================================================
 * TEMPORARY TESTING SIMULATION — REMOVE BEFORE PRODUCTION BACKEND HANDOFF
 * Stores Admin-added test books & cover images locally so the Admin -> Customer
 * catalogue flow can be tested without a running image/catalogue server.
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

function writeTestBooks(books) {
  try {
    window.localStorage.setItem(TEST_BOOKS_KEY, JSON.stringify(books));
  } catch {
    // Ignore storage quota errors.
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

function writeTestImage(bookId, imageUrl) {
  try {
    const map = readTestImageMap();
    const key = String(bookId);
    if (imageUrl) {
      map[key] = imageUrl;
    } else {
      delete map[key];
    }
    window.localStorage.setItem(TEST_BOOK_IMAGES_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors.
  }
}

function isOfflineOrUnavailableError(err) {
  if (!err || !err.response) {
    return true;
  }
  const status = err.response.status;
  return status === 404 || status === 405 || status >= 500;
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
 * Retrieve all books in stock from GET /api/books
 * (merged with any temporary testing books added by the Admin).
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
    // TEMPORARY TESTING FALLBACK: return simulated test books when server is offline
    const rawTestStore = window.localStorage.getItem(TEST_BOOKS_KEY);
    if (isOfflineOrUnavailableError(err) && rawTestStore !== null) {
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

/**
 * Add a new book to stock via POST /api/books.
 * Falls back to the temporary local testing store if the server is offline.
 */
export async function addBook(bookPayload) {
  const cleanTitle = String(bookPayload.title).trim();
  const cleanAuthor = String(bookPayload.author).trim();
  const cleanPrice = Number(bookPayload.price);
  const cleanStock = Number(bookPayload.stockQuantity);
  const cleanImageUrl = String(bookPayload.imageUrl || '').trim();

  const requestBody = {
    title: cleanTitle,
    author: cleanAuthor,
    price: cleanPrice,
    stockQuantity: cleanStock,
    ...(cleanImageUrl ? { imageUrl: cleanImageUrl } : {}),
  };

  try {
    const response = await axiosClient.post('/api/books', requestBody);
    const created = response.data || {};
    if (created.bookId && cleanImageUrl) {
      writeTestImage(created.bookId, cleanImageUrl);
    }
    return created;
  } catch (err) {
    if (!isOfflineOrUnavailableError(err)) {
      throw err;
    }

    // TEMPORARY TESTING SIMULATION: persist added book locally so it features in the catalogue
    const existing = readTestBooks();
    const maxId = existing.reduce((max, item) => Math.max(max, Number(item.bookId) || 0), 1000);
    const simulatedBook = {
      bookId: maxId + 1,
      title: cleanTitle,
      author: cleanAuthor,
      price: cleanPrice,
      stockQuantity: cleanStock,
      imageUrl: cleanImageUrl,
      isSimulatedTest: true,
    };

    writeTestBooks([...existing, simulatedBook]);
    if (cleanImageUrl) {
      writeTestImage(simulatedBook.bookId, cleanImageUrl);
    }

    return { ...simulatedBook, _simulated: true };
  }
}

/**
 * Update an existing book's details and/or stock quantity via PUT /api/books/{bookId}
 * (with PATCH /api/books/{bookId} fallback and temporary local test support).
 */
export async function updateBook(bookId, bookPayload) {
  const cleanTitle = String(bookPayload.title).trim();
  const cleanAuthor = String(bookPayload.author).trim();
  const cleanPrice = Number(bookPayload.price);
  const cleanStock = Math.max(0, Number(bookPayload.stockQuantity));
  const hasImageField = Object.prototype.hasOwnProperty.call(bookPayload, 'imageUrl');
  const cleanImageUrl = hasImageField ? String(bookPayload.imageUrl || '').trim() : undefined;

  const existingTestBooks = readTestBooks();
  const testIndex = existingTestBooks.findIndex((b) => String(b.bookId) === String(bookId));

  if (testIndex !== -1) {
    const current = existingTestBooks[testIndex];
    const updated = {
      ...current,
      title: cleanTitle,
      author: cleanAuthor,
      price: cleanPrice,
      stockQuantity: cleanStock,
      imageUrl: cleanImageUrl !== undefined ? cleanImageUrl : current.imageUrl || '',
    };
    const nextList = [...existingTestBooks];
    nextList[testIndex] = updated;
    writeTestBooks(nextList);
    if (cleanImageUrl !== undefined) {
      writeTestImage(bookId, cleanImageUrl);
    }
    return { ...updated, _simulated: true };
  }

  const body = {
    bookId,
    title: cleanTitle,
    author: cleanAuthor,
    price: cleanPrice,
    stockQuantity: cleanStock,
    ...(cleanImageUrl ? { imageUrl: cleanImageUrl } : {}),
  };

  try {
    const response = await axiosClient.put(`/api/books/${encodeURIComponent(bookId)}`, body);
    if (cleanImageUrl !== undefined) {
      writeTestImage(bookId, cleanImageUrl);
    }
    return response.data;
  } catch (err) {
    if (err.response && err.response.status === 405) {
      try {
        const patchResponse = await axiosClient.patch(`/api/books/${encodeURIComponent(bookId)}`, body);
        if (cleanImageUrl !== undefined) {
          writeTestImage(bookId, cleanImageUrl);
        }
        return patchResponse.data;
      } catch (patchErr) {
        if (!isOfflineOrUnavailableError(patchErr)) {
          throw patchErr;
        }
      }
    } else if (!isOfflineOrUnavailableError(err)) {
      throw err;
    }

    if (cleanImageUrl !== undefined) {
      writeTestImage(bookId, cleanImageUrl);
    }
    return { ...body, _simulated: true };
  }
}

/**
 * Delete/remove a book from stock via DELETE /api/books/{bookId}.
 */
export async function deleteBook(bookId) {
  const existingTestBooks = readTestBooks();
  const isLocalTestBook = existingTestBooks.some((b) => String(b.bookId) === String(bookId));

  if (isLocalTestBook) {
    const remaining = existingTestBooks.filter((b) => String(b.bookId) !== String(bookId));
    writeTestBooks(remaining);
    writeTestImage(bookId, '');
    return { deleted: true, _simulated: true };
  }

  const response = await axiosClient.delete(`/api/books/${encodeURIComponent(bookId)}`);
  writeTestImage(bookId, '');
  return response.data;
}
