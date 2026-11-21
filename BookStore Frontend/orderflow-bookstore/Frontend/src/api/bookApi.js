import axiosClient from './axiosClient';

/**
 * Fetch books from the Spring Boot catalogue and normalize its `id` field for the storefront.
 */
export async function fetchBooks() {
  const response = await axiosClient.get('/api/books');
  const payload = response.data;
  const books = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.books)
      ? payload.books
      : Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload?.data)
          ? payload.data
          : null;

  if (!books) {
    throw new Error('The bookstore service returned an invalid catalogue response.');
  }

  return books.map((book) => {
    const bookId = book.bookId ?? book.id;
    if (bookId === null || bookId === undefined) {
      throw new Error('The bookstore service returned a book without an ID.');
    }
    return { ...book, bookId };
  });
}
