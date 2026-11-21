import { BookOpen, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import QuantitySelector from './QuantitySelector';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrderForm({
  fullName,
  email,
  onFullNameChange,
  onEmailChange,
  items = [],
  estimatedTotal = 0,
  availableBooks = [],
  booksLoading = false,
  booksError = null,
  onRetryBooks,
  onAddBook,
  onUpdateQuantity,
  onRemoveItem,
  onSubmit,
  submitting = false,
}) {
  const [selectedBookId, setSelectedBookId] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const getInCartQty = (bookId) => {
    const match = items.find((entry) => String(entry.bookId) === String(bookId));
    return match ? match.quantity : 0;
  };

  const handleAddSelectedBook = () => {
    if (!selectedBookId || submitting) {
      return;
    }
    const chosenBook = availableBooks.find(
      (b) => String(b.bookId) === String(selectedBookId)
    );
    if (!chosenBook) {
      return;
    }
    const remainingStock = Number(chosenBook.stockQuantity ?? 0) - getInCartQty(chosenBook.bookId);
    if (remainingStock <= 0) {
      return;
    }

    onAddBook(chosenBook, 1);
    setSelectedBookId('');
    if (validationErrors.selectedBooks) {
      setValidationErrors((prev) => ({ ...prev, selectedBooks: undefined }));
    }
  };

  const validate = () => {
    const errors = {};
    const trimmedName = String(fullName || '').trim();
    const trimmedEmail = String(email || '').trim();

    if (!trimmedName) {
      errors.fullName = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'Please enter at least 2 characters for your full name.';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g. alex@example.com).';
    }

    if (!items || items.length === 0) {
      errors.selectedBooks = 'Please add at least one book to your order before submitting.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate() || submitting) {
      return;
    }
    onSubmit({
      fullName: fullName.trim(),
      email: email.trim(),
    });
  };

  const chosenBookObj = availableBooks.find(
    (b) => String(b.bookId) === String(selectedBookId)
  );
  const canAddChosenBook = Boolean(
    chosenBookObj
      && Number(chosenBookObj.stockQuantity ?? 0) - getInCartQty(chosenBookObj.bookId) > 0
  );

  return (
    <form className="cf-card cf-merged-order-form" onSubmit={handleSubmit} noValidate>
      {/* Section 1: Customer Information */}
      <div>
        <h2 className="cf-section-title">Customer Information</h2>
        <p className="cf-section-desc">
          Enter your name and email address to place your order.
        </p>

        <div className="cf-checkout-fields-grid">
          <div className="cf-form-field">
            <label htmlFor="customer-full-name" className="cf-label">
              Full Name
            </label>
            <input
              id="customer-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              className={`cf-input ${validationErrors.fullName ? 'cf-input-error' : ''}`}
              placeholder="e.g. Alex Example"
              value={fullName}
              onChange={(e) => {
                onFullNameChange(e.target.value);
                if (validationErrors.fullName) {
                  setValidationErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              disabled={submitting}
              required
            />
            {validationErrors.fullName ? (
              <p className="cf-field-error">{validationErrors.fullName}</p>
            ) : null}
          </div>

          <div className="cf-form-field">
            <label htmlFor="customer-email" className="cf-label">
              Email Address
            </label>
            <input
              id="customer-email"
              name="email"
              type="email"
              autoComplete="email"
              className={`cf-input ${validationErrors.email ? 'cf-input-error' : ''}`}
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => {
                onEmailChange(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              disabled={submitting}
              required
            />
            {validationErrors.email ? (
              <p className="cf-field-error">{validationErrors.email}</p>
            ) : null}
          </div>
        </div>
      </div>

      <hr className="cf-form-divider" />

      {/* Section 2: Selected Books Input & Selected Order Items */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
          <h2 className="cf-section-title" style={{ marginBottom: 0 }}>
            Selected Order Items
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--cf-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {items.reduce((sum, item) => sum + item.quantity, 0)} book(s) selected
          </span>
        </div>
        <p className="cf-section-desc">
          Choose books to include in your order and adjust quantities before submitting.
        </p>

        <div className="cf-form-field">
          <label htmlFor="selected-books-input" className="cf-label">
            Selected Books
          </label>
          <div className="cf-selected-books-row">
            <select
              id="selected-books-input"
              name="selectedBooks"
              className={`cf-input ${validationErrors.selectedBooks ? 'cf-input-error' : ''}`}
              value={selectedBookId}
              onChange={(e) => {
                setSelectedBookId(e.target.value);
                if (validationErrors.selectedBooks) {
                  setValidationErrors((prev) => ({ ...prev, selectedBooks: undefined }));
                }
              }}
              disabled={submitting || booksLoading}
            >
              <option value="">
                {booksLoading
                  ? 'Loading available books...'
                  : availableBooks.length === 0
                    ? 'No books currently loaded'
                    : 'Choose a book to add to your order...'}
              </option>
              {availableBooks.map((book) => {
                const stock = Number(book.stockQuantity ?? 0);
                const remaining = Math.max(0, stock - getInCartQty(book.bookId));
                const labelSuffix = stock <= 0
                  ? 'Out of stock'
                  : remaining <= 0
                    ? 'Max selected'
                    : `${remaining} available`;
                return (
                  <option
                    key={book.bookId}
                    value={String(book.bookId)}
                    disabled={remaining <= 0}
                  >
                    {book.title} — ${formatCurrency(book.price)} ({labelSuffix})
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              className="cf-btn cf-btn-secondary"
              onClick={handleAddSelectedBook}
              disabled={submitting || !canAddChosenBook}
            >
              <Plus size={15} aria-hidden="true" />
              <span>Add Book</span>
            </button>
          </div>

          {booksError ? (
            <p className="cf-field-error" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>Could not load available books list.</span>
              {typeof onRetryBooks === 'function' ? (
                <button
                  type="button"
                  onClick={onRetryBooks}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--cf-accent)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Retry
                </button>
              ) : null}
            </p>
          ) : null}

          {validationErrors.selectedBooks ? (
            <p className="cf-field-error">{validationErrors.selectedBooks}</p>
          ) : null}
        </div>

        {!items || items.length === 0 ? (
          <div className="cf-inline-empty">
            <BookOpen size={22} color="var(--cf-text-muted)" aria-hidden="true" />
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.925rem', color: 'var(--cf-text-primary)' }}>
                No books selected yet
              </p>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--cf-text-secondary)' }}>
                Pick a title from the Selected Books input above or{' '}
                <Link to="/" style={{ color: 'var(--cf-accent)', fontWeight: 600 }}>
                  browse the full catalogue
                </Link>
                .
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul className="cf-cart-list">
              {items.map((item) => {
                const lineTotal = item.unitPrice * item.quantity;
                return (
                  <li key={item.bookId} className="cf-merged-item-row">
                    <div className="cf-merged-item-info">
                      <p className="cf-cart-item-title">{item.title}</p>
                      <span className="cf-cart-item-sub">
                        {item.quantity} × ${formatCurrency(item.unitPrice)}
                        {item.author ? ` · ${item.author}` : ''}
                      </span>
                    </div>

                    <div className="cf-merged-item-controls">
                      <QuantitySelector
                        value={item.quantity}
                        maxStock={item.stockQuantity}
                        onChange={(qty) => onUpdateQuantity(item.bookId, qty)}
                        itemLabel={item.title}
                      />
                      <span className="cf-cart-line-total" style={{ minWidth: 82, textAlign: 'right' }}>
                        ${formatCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        className="cf-btn cf-btn-ghost"
                        onClick={() => onRemoveItem(item.bookId)}
                        disabled={submitting}
                        aria-label={`Remove ${item.title} from order`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="cf-cart-total-row">
              <span className="cf-cart-total-label">Estimated Total</span>
              <span className="cf-cart-total-amount">${formatCurrency(estimatedTotal)}</span>
            </div>

            <div className="cf-authority-note">
              Estimated total only. The final confirmed price is calculated when your order is placed.
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        className="cf-btn cf-btn-primary cf-btn-full"
        disabled={submitting}
        style={{ marginTop: 8 }}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="cf-spin" aria-hidden="true" />
            <span>Placing Your Order...</span>
          </>
        ) : (
          <>
            <Send size={16} aria-hidden="true" />
            <span>Submit Order</span>
          </>
        )}
      </button>
    </form>
  );
}
