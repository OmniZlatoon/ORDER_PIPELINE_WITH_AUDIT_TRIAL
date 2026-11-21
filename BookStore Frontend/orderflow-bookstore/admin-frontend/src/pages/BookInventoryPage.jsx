import { CheckCircle2, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { extractApiError } from '../api/axiosClient';
import { addBook, deleteBook, updateBook } from '../api/bookApi';
import BookInventoryTable from '../components/BookInventoryTable';
import BookStockForm from '../components/BookStockForm';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useBooks } from '../hooks/useBooks';

export default function BookInventoryPage() {
  const { books, loading, error, refetch } = useBooks();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBook, setEditingBook] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [busyBookId, setBusyBookId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const filteredBooks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return books;
    }
    return books.filter(
      (b) =>
        String(b.title || '').toLowerCase().includes(q)
        || String(b.author || '').toLowerCase().includes(q)
        || String(b.bookId || '').includes(q)
    );
  }, [books, searchTerm]);

  const inventoryStats = useMemo(() => {
    const totalTitles = books.length;
    const totalUnits = books.reduce((sum, b) => sum + Number(b.stockQuantity ?? 0), 0);
    const inStock = books.filter((b) => Number(b.stockQuantity ?? 0) > 0).length;
    const outOfStock = totalTitles - inStock;
    return { totalTitles, totalUnits, inStock, outOfStock };
  }, [books]);

  const handleFormSubmit = async (payload) => {
    setSubmittingForm(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (editingBook) {
        await updateBook(editingBook.bookId, payload);
        setActionSuccess(`Updated "${payload.title}" (stock: ${payload.stockQuantity}).`);
        setEditingBook(null);
      } else {
        await addBook(payload);
        setActionSuccess(`Added "${payload.title}" to stock (${payload.stockQuantity} units).`);
      }
      await refetch();
      return true;
    } catch (err) {
      const fallback = editingBook
        ? `Unable to update book #${editingBook.bookId}.`
        : 'Unable to add book to stock.';
      const normalized = extractApiError(err, fallback);
      if (normalized.endpointUnavailable) {
        setActionError(
          editingBook
            ? 'Updating book details is not currently enabled on the server.'
            : 'Adding new books is not currently enabled on the server.'
        );
      } else {
        setActionError(normalized.message);
      }
      return false;
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleAdjustStock = async (book, nextQuantity) => {
    setBusyBookId(book.bookId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await updateBook(book.bookId, {
        title: book.title,
        author: book.author,
        price: book.price,
        stockQuantity: nextQuantity,
        imageUrl: book.imageUrl || '',
      });
      setActionSuccess(`Updated stock for "${book.title}" to ${nextQuantity} units.`);
      if (editingBook && editingBook.bookId === book.bookId) {
        setEditingBook({ ...book, stockQuantity: nextQuantity });
      }
      await refetch();
    } catch (err) {
      const normalized = extractApiError(err, `Unable to update stock for "${book.title}".`);
      if (normalized.endpointUnavailable) {
        setActionError(
          'Adjusting stock levels is not currently enabled on the server.'
        );
      } else {
        setActionError(normalized.message);
      }
    } finally {
      setBusyBookId(null);
    }
  };

  const handleDeleteBook = async (book) => {
    setBusyBookId(book.bookId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await deleteBook(book.bookId);
      setActionSuccess(`Deleted "${book.title}" (#${book.bookId}) from stock.`);
      if (editingBook && editingBook.bookId === book.bookId) {
        setEditingBook(null);
      }
      await refetch();
    } catch (err) {
      const normalized = extractApiError(err, `Unable to delete book #${book.bookId}.`);
      if (normalized.endpointUnavailable) {
        setActionError(
          'Removing books from stock is not currently enabled on the server.'
        );
      } else {
        setActionError(normalized.message);
      }
    } finally {
      setBusyBookId(null);
    }
  };

  return (
    <div className="af-stack">
      <section className="af-wave-hero" aria-label="Book stock management header">
        <div className="af-wave-hero-shape-1" aria-hidden="true" />
        <div className="af-wave-hero-shape-2" aria-hidden="true" />

        <div className="af-wave-hero-inner">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 className="af-page-title" style={{ color: '#ffffff' }}>
                Book Stock Management
              </h1>
              <p className="af-page-subtitle" style={{ color: 'rgba(255, 255, 255, 0.82)' }}>
                Add new titles, update prices and stock quantities, or remove books from store inventory.
              </p>
            </div>

            <button
              type="button"
              onClick={refetch}
              className="af-btn af-btn-secondary"
              disabled={loading}
              style={{ border: 'none' }}
            >
              <RefreshCw size={15} className={loading ? 'af-spin' : ''} aria-hidden="true" />
              <span>Refresh Stock</span>
            </button>
          </div>

          <div className="af-search-input-wrap" style={{ maxWidth: 520 }}>
            <Search size={16} className="af-search-icon" style={{ left: 16 }} aria-hidden="true" />
            <input
              type="search"
              className="af-input af-input-with-icon"
              style={{ width: '100%', paddingLeft: 42, border: 'none' }}
              placeholder="Filter stock by Book ID, title, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Filter stock by Book ID, title, or author"
            />
          </div>
        </div>
      </section>

      {actionSuccess ? (
        <div className="af-alert af-alert-success" role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{actionSuccess}</span>
          </div>
        </div>
      ) : null}

      {actionError ? <ErrorMessage title="Inventory update failed" message={actionError} /> : null}

      {!loading && !error ? (
        <div className="af-kpi-grid" aria-label="Book stock summary">
          <div className="af-kpi-card">
            <div className="af-kpi-label">Total Book Titles</div>
            <div className="af-kpi-value">{inventoryStats.totalTitles}</div>
          </div>
          <div className="af-kpi-card">
            <div className="af-kpi-label">Total Units in Stock</div>
            <div className="af-kpi-value">{inventoryStats.totalUnits}</div>
          </div>
          <div className="af-kpi-card">
            <div className="af-kpi-label">In Stock Titles</div>
            <div className="af-kpi-value" style={{ color: 'var(--af-success-text)' }}>
              {inventoryStats.inStock}
            </div>
          </div>
          <div className="af-kpi-card">
            <div className="af-kpi-label">Out of Stock</div>
            <div className="af-kpi-value" style={{ color: 'var(--af-error-text)' }}>
              {inventoryStats.outOfStock}
            </div>
          </div>
        </div>
      ) : null}

      <BookStockForm
        editingBook={editingBook}
        onSubmit={handleFormSubmit}
        onCancelEdit={() => setEditingBook(null)}
        submitting={submittingForm}
      />

      <section className="af-card" aria-label="Books in stock table">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 className="af-section-title">Catalogue Inventory</h2>
            <p className="af-section-desc" style={{ marginBottom: 0 }}>
              Use - / + to quickly adjust stock, Update to edit book details, or Delete to remove a book.
            </p>
          </div>
          <span className="af-mono" style={{ fontSize: '0.82rem', color: 'var(--af-text-muted)' }}>
            {filteredBooks.length} of {books.length} books
          </span>
        </div>

        {error ? (
          <ErrorMessage title="Unable to load book stock" message={error} onRetry={refetch} />
        ) : loading ? (
          <LoadingSpinner message="Loading book inventory..." />
        ) : (
          <BookInventoryTable
            books={filteredBooks}
            busyBookId={busyBookId}
            editingBookId={editingBook?.bookId}
            onAdjustStock={handleAdjustStock}
            onEditBook={(book) => setEditingBook(book)}
            onDeleteBook={handleDeleteBook}
          />
        )}
      </section>
    </div>
  );
}
