import { BookOpen, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from './StatusBadge';

function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function TableCoverThumb({ imageUrl, title }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <span className="af-table-thumb af-table-thumb-empty" aria-hidden="true">
        <BookOpen size={15} />
      </span>
    );
  }

  return (
    <span className="af-table-thumb">
      <img
        src={imageUrl}
        alt={`Cover for ${title}`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export default function BookInventoryTable({
  books = [],
  busyBookId,
  editingBookId,
  onAdjustStock,
  onEditBook,
  onDeleteBook,
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  if (!books || books.length === 0) {
    return (
      <div className="af-empty">
        <BookOpen size={28} color="#64748b" aria-hidden="true" />
        <h3 className="af-empty-title">No books found in stock</h3>
        <p className="af-empty-text" style={{ marginBottom: 0 }}>
          Add a new book using the form above or adjust your search filter.
        </p>
      </div>
    );
  }

  return (
    <div className="af-table-wrap">
      <table className="af-table">
        <thead>
          <tr>
            <th>Book ID</th>
            <th>Title</th>
            <th>Author</th>
            <th>Unit Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => {
            const stock = Number(book.stockQuantity ?? 0);
            const isBusy = busyBookId === book.bookId;
            const isEditing = editingBookId === book.bookId;
            const isConfirming = confirmDeleteId === book.bookId;

            return (
              <tr
                key={book.bookId}
                style={isEditing ? { backgroundColor: 'var(--af-bg-subtle)' } : undefined}
              >
                <td className="af-mono">#{book.bookId}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
                    <TableCoverThumb imageUrl={book.imageUrl} title={book.title} />
                    <span>{book.title}</span>
                  </div>
                </td>
                <td>{book.author || '—'}</td>
                <td className="af-mono" style={{ fontWeight: 600 }}>
                  {formatCurrency(book.price)}
                </td>
                <td className="af-mono" style={{ fontWeight: 600 }}>
                  {stock}
                </td>
                <td>
                  {stock > 0 ? (
                    <StatusBadge status="SUCCESS" label="IN STOCK" />
                  ) : (
                    <StatusBadge status="FAILED" label="OUT OF STOCK" />
                  )}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="af-btn af-btn-secondary"
                      style={{ minHeight: 34, padding: '5px 10px' }}
                      disabled={isBusy || stock <= 0}
                      onClick={() => onAdjustStock(book, stock - 1)}
                      aria-label={`Remove 1 from stock for ${book.title}`}
                      title="Decrease stock by 1"
                    >
                      <Minus size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="af-btn af-btn-secondary"
                      style={{ minHeight: 34, padding: '5px 10px' }}
                      disabled={isBusy}
                      onClick={() => onAdjustStock(book, stock + 1)}
                      aria-label={`Add 1 to stock for ${book.title}`}
                      title="Increase stock by 1"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className="af-btn af-btn-secondary"
                      style={{ minHeight: 34, padding: '5px 12px', fontSize: '0.8rem' }}
                      disabled={isBusy}
                      onClick={() => {
                        setConfirmDeleteId(null);
                        onEditBook(book);
                      }}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      <span>Update</span>
                    </button>

                    {isConfirming ? (
                      <>
                        <button
                          type="button"
                          className="af-btn af-btn-danger"
                          style={{ minHeight: 34, padding: '5px 12px', fontSize: '0.8rem' }}
                          disabled={isBusy}
                          onClick={async () => {
                            await onDeleteBook(book);
                            setConfirmDeleteId(null);
                          }}
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          className="af-btn af-btn-secondary"
                          style={{ minHeight: 34, padding: '5px 10px', fontSize: '0.8rem' }}
                          disabled={isBusy}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="af-btn af-btn-secondary"
                        style={{ minHeight: 34, padding: '5px 12px', fontSize: '0.8rem', color: 'var(--af-error-text)' }}
                        disabled={isBusy}
                        onClick={() => setConfirmDeleteId(book.bookId)}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
