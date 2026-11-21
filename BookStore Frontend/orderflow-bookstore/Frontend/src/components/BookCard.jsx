import { Check, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import QuantitySelector from './QuantitySelector';

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getBookInitials(title) {
  const words = String(title || 'BK').trim().split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
}

const BOOK_PALETTES = [
  { top: '#0b7a69', bottom: '#085e52' },
  { top: '#35235a', bottom: '#23163e' },
  { top: '#b45309', bottom: '#92400e' },
  { top: '#be123c', bottom: '#9f1239' },
  { top: '#1d4ed8', bottom: '#1e3a8a' },
  { top: '#0f2622', bottom: '#1b433c' },
];

export function getBookPalette(bookId) {
  const raw = Number(bookId);
  let index = 0;
  if (Number.isFinite(raw)) {
    index = Math.abs(Math.trunc(raw));
  } else {
    const str = String(bookId || '');
    for (let i = 0; i < str.length; i += 1) {
      index += str.charCodeAt(i);
    }
  }
  return BOOK_PALETTES[index % BOOK_PALETTES.length];
}

export default function BookCard({
  book,
  currentCartQty = 0,
  onAddToCart,
  viewMode = 'grid',
}) {
  const stockQuantity = Number(book.stockQuantity ?? 0);
  const isOutOfStock = stockQuantity <= 0;
  const remainingAddable = Math.max(0, stockQuantity - currentCartQty);
  const [selectedQty, setSelectedQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const imageSrc = String(book.imageUrl || book.coverImage || '').trim();

  useEffect(() => {
    setImgFailed(false);
  }, [imageSrc]);

  const clampedQty = Math.min(Math.max(1, selectedQty), Math.max(1, remainingAddable));

  const handleAdd = () => {
    if (isOutOfStock || remainingAddable <= 0) {
      return;
    }
    onAddToCart(book, clampedQty);
    setSelectedQty(1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  const palette = getBookPalette(book.bookId);
  const coverStyle = {
    '--cf-book-top': palette.top,
    '--cf-book-bottom': palette.bottom,
  };
  const hasValidImage = Boolean(imageSrc) && !imgFailed;

  if (viewMode === 'list') {
    return (
      <article className="cf-book-row-card">
        {hasValidImage ? (
          <div className="cf-book-thumb cf-book-thumb-photo">
            <img
              src={imageSrc}
              alt={`Cover for ${book.title}`}
              className="cf-book-thumb-img"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
          </div>
        ) : (
          <div className="cf-book-thumb" style={coverStyle}>
            <span className="cf-book-monogram" style={{ fontSize: '1.15rem' }}>
              {getBookInitials(book.title)}
            </span>
            <span className="cf-book-id">#{book.bookId}</span>
          </div>
        )}

        <div className="cf-book-row-info">
          <h3 className="cf-book-title" style={{ marginBottom: 4 }}>
            {book.title}
          </h3>
          <p className="cf-book-author" style={{ marginBottom: 8 }}>
            by {book.author || 'Unknown Author'}
          </p>
          {isOutOfStock ? (
            <span className="cf-book-stock cf-book-stock-out">Out of stock</span>
          ) : (
            <span className="cf-book-stock">{stockQuantity} in stock</span>
          )}
        </div>

        <div className="cf-book-row-right">
          <span className="cf-book-price-pill">${formatCurrency(book.price)}</span>
          {isOutOfStock ? (
            <button type="button" className="cf-btn cf-btn-secondary" disabled>
              Unavailable
            </button>
          ) : remainingAddable === 0 ? (
            <button type="button" className="cf-btn cf-btn-secondary" disabled>
              Max Selected ({currentCartQty})
            </button>
          ) : (
            <div className="cf-book-actions">
              <QuantitySelector
                value={clampedQty}
                maxStock={remainingAddable}
                onChange={setSelectedQty}
                itemLabel={book.title}
              />
              <button type="button" onClick={handleAdd} className="cf-btn cf-btn-primary">
                {justAdded ? <Check size={15} aria-hidden="true" /> : <ShoppingBag size={15} aria-hidden="true" />}
                <span>{justAdded ? 'Added' : 'Add'}</span>
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="cf-book-card">
      <div className="cf-book-cover">
        {hasValidImage ? (
          <div className="cf-book-cover-frame">
            <img
              src={imageSrc}
              alt={`Cover for ${book.title}`}
              className="cf-book-cover-img"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
          </div>
        ) : (
          <div className="cf-book-spine-art" style={coverStyle}>
            <span className="cf-book-monogram">{getBookInitials(book.title)}</span>
            <span className="cf-book-id">#{book.bookId}</span>
          </div>
        )}
      </div>

      <div className="cf-book-body">
        <p className="cf-book-author">by {book.author || 'Unknown Author'}</p>
        <h3 className="cf-book-title">{book.title}</h3>

        <div className="cf-book-meta-row">
          <span className="cf-book-price-pill">${formatCurrency(book.price)}</span>
          {isOutOfStock ? (
            <span className="cf-book-stock cf-book-stock-out">Out of stock</span>
          ) : (
            <span className="cf-book-stock">{stockQuantity} in stock</span>
          )}
        </div>

        {isOutOfStock ? (
          <button type="button" className="cf-btn cf-btn-secondary cf-btn-full" disabled>
            Out of Stock
          </button>
        ) : remainingAddable === 0 ? (
          <button type="button" className="cf-btn cf-btn-secondary cf-btn-full" disabled>
            Max Selected ({currentCartQty})
          </button>
        ) : (
          <div className="cf-book-actions">
            <QuantitySelector
              value={clampedQty}
              maxStock={remainingAddable}
              onChange={setSelectedQty}
              itemLabel={book.title}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="cf-btn cf-btn-primary"
              style={{ flex: 1 }}
            >
              {justAdded ? <Check size={15} aria-hidden="true" /> : <ShoppingBag size={15} aria-hidden="true" />}
              <span>{justAdded ? 'Added' : 'Add'}</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
