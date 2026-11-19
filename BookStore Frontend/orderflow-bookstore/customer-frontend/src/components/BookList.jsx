import { BookOpen } from 'lucide-react';
import BookCard from './BookCard';

export default function BookList({ books, cartItems, onAddToCart, viewMode = 'grid' }) {
  if (!books || books.length === 0) {
    return (
      <div className="cf-empty">
        <BookOpen size={32} color="#627d98" aria-hidden="true" />
        <h3 className="cf-empty-title">No books available</h3>
        <p className="cf-empty-text">
          No books matched your search, or no books are currently listed.
        </p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'list' ? 'cf-book-list-stack' : 'cf-book-grid'}>
      {books.map((book) => {
        const inCart = cartItems.find((item) => item.bookId === book.bookId);
        return (
          <BookCard
            key={book.bookId}
            book={book}
            currentCartQty={inCart ? inCart.quantity : 0}
            onAddToCart={onAddToCart}
            viewMode={viewMode}
          />
        );
      })}
    </div>
  );
}
