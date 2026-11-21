import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  LayoutGrid,
  Lightbulb,
  List,
  MailCheck,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookPalette } from '../components/BookCard';
import BookList from '../components/BookList';
import CartSummary from '../components/CartSummary';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { useBooks } from '../hooks/useBooks';

function OpenBookHeroIllustration() {
  return (
    <svg
      width="320"
      height="196"
      viewBox="0 0 320 196"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="160" cy="48" r="22" fill="#FDE68A" opacity="0.28" />
      <path d="M160 12V20M184 22L179 27M136 22L141 27M192 48H184M136 48H128" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
      <path d="M148 47C148 39.8 153.4 34 160 34C166.6 34 172 39.8 172 47C172 52 169 56 165.5 58.6C164.6 59.3 164 60.4 164 61.5V65H156V61.5C156 60.4 155.4 59.3 154.5 58.6C151 56 148 52 148 47Z" fill="#F59E0B" />
      <rect x="155" y="67" width="10" height="4" rx="2" fill="#D6ECE7" />

      <rect x="24" y="138" width="76" height="18" rx="4" transform="rotate(-8 24 138)" fill="#35235A" />
      <rect x="30" y="120" width="72" height="17" rx="4" transform="rotate(4 30 120)" fill="#F59E0B" />
      <rect x="220" y="136" width="76" height="18" rx="4" transform="rotate(7 220 136)" fill="#0F2622" />
      <rect x="216" y="118" width="72" height="17" rx="4" transform="rotate(-5 216 118)" fill="#D6ECE7" />

      <path d="M62 110C62 103 68 98 75 98H146C153 98 159 103 160 110V172C155 167 148 165 140 165H74C67 165 62 160 62 153V110Z" fill="#FFFFFF" />
      <path d="M258 110C258 103 252 98 245 98H174C167 98 161 103 160 110V172C165 167 172 165 180 165H246C253 165 258 160 258 153V110Z" fill="#F3FAF8" />
      <path d="M56 155H264V168C264 174 259 178 253 178H67C61 178 56 174 56 168V155Z" fill="#085E52" />
      <rect x="172" y="164" width="14" height="22" rx="2" fill="#F59E0B" />
      <path d="M80 118H140M80 132H136M80 146H126" stroke="#C5D4cf" strokeWidth="3" strokeLinecap="round" />
      <path d="M180 118H240M184 132H240M194 146H240" stroke="#C5D4cf" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LibraryStackIllustration() {
  return (
    <svg
      width="220"
      height="170"
      viewBox="0 0 220 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="148" rx="76" ry="11" fill="rgba(8, 28, 26, 0.12)" />
      <rect x="48" y="114" width="124" height="24" rx="6" fill="#085E52" />
      <rect x="56" y="120" width="108" height="12" rx="3" fill="#FFFFFF" />
      <rect x="58" y="88" width="108" height="24" rx="6" fill="#35235A" />
      <rect x="66" y="94" width="92" height="12" rx="3" fill="#E9D5FF" />
      <rect x="52" y="62" width="116" height="24" rx="6" fill="#F59E0B" />
      <rect x="60" y="68" width="100" height="12" rx="3" fill="#FEF3C7" />
      <rect x="68" y="36" width="88" height="24" rx="6" fill="#0B7A69" />
      <rect x="76" y="42" width="72" height="12" rx="3" fill="#D6ECE7" />
    </svg>
  );
}

function OrderPreviewVisual() {
  return (
    <svg
      width="240"
      height="200"
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="122" cy="102" r="76" fill="#D6ECE7" />
      <circle cx="122" cy="102" r="56" fill="#0B7A69" opacity="0.14" />
      <rect x="84" y="34" width="76" height="134" rx="14" fill="#FFFFFF" stroke="#C5D4CF" strokeWidth="2" />
      <rect x="96" y="50" width="52" height="10" rx="5" fill="#0B7A69" />
      <rect x="96" y="70" width="52" height="22" rx="6" fill="#EFF4F2" />
      <rect x="96" y="98" width="52" height="22" rx="6" fill="#EFF4F2" />
      <rect x="96" y="126" width="52" height="22" rx="6" fill="#35235A" />
      <rect x="54" y="102" width="66" height="18" rx="4" transform="rotate(-12 54 102)" fill="#F59E0B" />
      <rect x="58" y="122" width="66" height="18" rx="4" transform="rotate(6 58 122)" fill="#085E52" />
    </svg>
  );
}

function BottomShelfIllustration() {
  return (
    <svg
      width="136"
      height="88"
      viewBox="0 0 136 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="18" y="54" width="100" height="22" rx="5" fill="#085E52" />
      <rect x="26" y="60" width="84" height="10" rx="3" fill="#FFFFFF" />
      <rect x="28" y="30" width="80" height="22" rx="5" fill="#35235A" />
      <rect x="36" y="36" width="64" height="10" rx="3" fill="#E9D5FF" />
      <rect x="42" y="10" width="52" height="18" rx="4" fill="#F59E0B" />
    </svg>
  );
}

function getInitials(title) {
  return String(title || 'BK')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ARRIVAL_TINTS = ['#e3f2ef', '#ede9fe', '#fef3c7'];

const ORDER_STEPS_GUIDE = [
  {
    icon: ShieldCheck,
    title: '1. Validate Order',
    desc: 'Checks customer details and selected items.',
  },
  {
    icon: PackageCheck,
    title: '2. Check Inventory',
    desc: 'Verifies book stock before reserving copies.',
  },
  {
    icon: BookOpen,
    title: '3. Calculate Total',
    desc: 'Confirms exact unit pricing and final total.',
  },
  {
    icon: CreditCard,
    title: '4. Process Payment',
    desc: 'Records order payment confirmation.',
  },
  {
    icon: CheckCircle2,
    title: '5. Confirm Order',
    desc: 'Locks in your official order reference.',
  },
  {
    icon: MailCheck,
    title: '6. Complete & Notify',
    desc: 'Creates shipping and email updates once finished.',
  },
];

function FeaturedBookCover({ book }) {
  const [imgFailed, setImgFailed] = useState(false);
  const palette = getBookPalette(book.bookId);
  const imageSrc = String(book.imageUrl || book.coverImage || '').trim();

  if (imageSrc && !imgFailed) {
    return (
      <div
        className="cf-book-cover-frame"
        style={{ width: 82, height: 108 }}
      >
        <img
          src={imageSrc}
          alt={`Cover for ${book.title}`}
          className="cf-book-cover-img"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="cf-book-spine-art"
      style={{
        '--cf-book-top': palette.top,
        '--cf-book-bottom': palette.bottom,
        width: 82,
        height: 108,
      }}
    >
      <span className="cf-book-monogram" style={{ fontSize: '1.15rem' }}>
        {getInitials(book.title)}
      </span>
      <span className="cf-book-id">#{book.bookId}</span>
    </div>
  );
}

export default function BookCataloguePage() {
  const { books, loading, error, refetch } = useBooks();
  const { items, estimatedTotal, addItem, updateQuantity, removeItem } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [carouselPage, setCarouselPage] = useState(0);

  const inStockCount = useMemo(
    () => books.filter((b) => Number(b.stockQuantity ?? 0) > 0).length,
    [books]
  );

  const pageSize = 3;
  const totalCarouselPages = Math.max(1, Math.ceil(books.length / pageSize));
  const safeCarouselPage = Math.min(carouselPage, totalCarouselPages - 1);

  const featuredSlice = useMemo(() => {
    const start = safeCarouselPage * pageSize;
    return books.slice(start, start + pageSize);
  }, [books, safeCarouselPage]);

  const filteredBooks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return books.filter((book) => {
      const matchesQuery =
        !query
        || String(book.title || '').toLowerCase().includes(query)
        || String(book.author || '').toLowerCase().includes(query);
      const matchesStock =
        stockFilter === 'all' || Number(book.stockQuantity ?? 0) > 0;
      return matchesQuery && matchesStock;
    });
  }, [books, searchTerm, stockFilter]);

  const scrollToCatalogue = () => {
    const el = document.getElementById('catalogue-browse-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getCartQuantityForBook = (bookId) => {
    const match = items.find((item) => String(item.bookId) === String(bookId));
    return match ? match.quantity : 0;
  };

  return (
    <div>
      {/* 1. Centered Curved-Arch Hero */}
      <section className="cf-wave-hero" aria-label="Bookstore hero showcase">
        <div className="cf-wave-hero-shape-1" aria-hidden="true" />
        <div className="cf-wave-hero-shape-2" aria-hidden="true" />
        <div className="cf-hero-float cf-hero-float-left" aria-hidden="true">
          <BookOpen size={18} />
        </div>
        <div className="cf-hero-float cf-hero-float-right" aria-hidden="true">
          <Lightbulb size={18} />
        </div>

        <div className="cf-wave-hero-centered">
          <p className="cf-hero-kicker">OrderFlow Books · Online Catalogue</p>
          <h1 className="cf-hero-title">Expand your mind, reading a book</h1>
          <p className="cf-hero-subtitle">
            Reading great books opens new perspectives. Browse live inventory, build your order, and follow every confirmation step in real time.
          </p>

          <div className="cf-hero-cta-row">
            <button
              type="button"
              onClick={scrollToCatalogue}
              className="cf-hero-white-btn"
            >
              <span>Browse Books</span>
            </button>
            <Link to="/order-lookup" className="cf-hero-outline-btn">
              <span>Look Up Order</span>
            </Link>
          </div>
        </div>

        <div className="cf-hero-stage">
          <OpenBookHeroIllustration />
        </div>
        <div className="cf-hero-arch" aria-hidden="true" />
      </section>

      {/* 2. Featured / New Arrivals 3-Card Shelf with Working Carousel Controls */}
      {!loading && !error && books.length > 0 ? (
        <section className="cf-arrivals-section" aria-label="Featured catalogue highlights">
          <div className="cf-section-split-head">
            <div>
              <h2 className="cf-section-display">Featured Books</h2>
              <p className="cf-section-lead">
                Explore live titles from our bookstore shelves and add copies directly to your bag.
              </p>
            </div>

            {totalCarouselPages > 1 ? (
              <div className="cf-carousel-controls">
                <button
                  type="button"
                  className="cf-circle-nav-btn"
                  onClick={() => setCarouselPage((prev) => Math.max(0, prev - 1))}
                  disabled={safeCarouselPage === 0}
                  aria-label="Previous featured books"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="cf-circle-nav-btn"
                  onClick={() => setCarouselPage((prev) => Math.min(totalCarouselPages - 1, prev + 1))}
                  disabled={safeCarouselPage >= totalCarouselPages - 1}
                  aria-label="Next featured books"
                >
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="cf-arrivals-shelf">
            {featuredSlice.map((book, idx) => {
              const stockQty = Number(book.stockQuantity ?? 0);
              const inCartQty = getCartQuantityForBook(book.bookId);
              const canAdd = stockQty > 0 && stockQty - inCartQty > 0;

              return (
                <article key={book.bookId} className="cf-arrival-card">
                  <div
                    className="cf-arrival-stage"
                    style={{ backgroundColor: ARRIVAL_TINTS[idx % ARRIVAL_TINTS.length] }}
                  >
                    <FeaturedBookCover book={book} />
                  </div>

                  <div>
                    <div className="cf-arrival-meta">
                      <span>{book.author || 'Unknown Author'}</span>
                      <span className="cf-arrival-price">${formatCurrency(book.price)}</span>
                    </div>
                    <h3 className="cf-book-title" style={{ marginTop: 6, marginBottom: 6 }}>
                      {book.title}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: stockQty > 0 ? 'var(--cf-success-text)' : 'var(--cf-error-text)', fontWeight: 600 }}>
                      {stockQty > 0 ? `${stockQty} in stock` : 'Out of stock'}
                      {inCartQty > 0 ? ` · ${inCartQty} in bag` : ''}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`cf-btn ${canAdd ? 'cf-btn-secondary' : 'cf-btn-ghost'} cf-btn-full`}
                    disabled={!canAdd}
                    onClick={() => addItem(book, 1)}
                    style={{ marginTop: 'auto' }}
                  >
                    <ShoppingBag size={15} aria-hidden="true" />
                    <span>
                      {stockQty <= 0
                        ? 'Out of Stock'
                        : !canAdd
                          ? 'Max Selected'
                          : 'Add to Order'}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 3. About OrderFlow Editorial Frame */}
      <section className="cf-about-section" aria-label="About OrderFlow Books">
        <div className="cf-section-split-head">
          <h2 className="cf-section-display">About OrderFlow Books</h2>
          <p className="cf-section-lead">
            Every book order moves through clear, verifiable stages—from checking stock and calculating totals to sending shipping and email confirmations.
          </p>
        </div>

        <div className="cf-about-frame">
          <div className="cf-about-art-box">
            <LibraryStackIllustration />
          </div>

          <div className="cf-about-panel">
            <div>
              <h3 className="cf-section-display" style={{ fontSize: '1.45rem', marginBottom: 8 }}>
                The OrderFlow Bookstore
              </h3>
              <p className="cf-section-lead">
                Browse real-time book availability, reserve exact quantities within current stock limits, and inspect every completed order step with full transparency.
              </p>
            </div>

            <div className="cf-about-stats">
              <div>
                <div className="cf-stat-label">Catalogue Titles</div>
                <div className="cf-stat-value cf-mono">{loading ? '—' : books.length}</div>
              </div>
              <div>
                <div className="cf-stat-label">Ready In Stock</div>
                <div className="cf-stat-value cf-mono">{loading ? '—' : inStockCount}</div>
              </div>
              <div>
                <div className="cf-stat-label">Order Tracking</div>
                <div className="cf-stat-value">6 Live Stages</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Full Searchable Book Catalogue & Cart Summary */}
      <div id="catalogue-browse-section" className="cf-catalogue-layout">
        <div>
          <div className="cf-catalogue-toolbar">
            <div>
              <h2 className="cf-section-title" style={{ marginBottom: 2 }}>
                Browse All Books
              </h2>
              {!loading && !error ? (
                <span style={{ fontSize: '0.84rem', color: 'var(--cf-text-muted)' }}>
                  Showing {filteredBooks.length} of {books.length} available titles
                </span>
              ) : null}
            </div>

            <div className="cf-toolbar-controls">
              <div className="cf-seg-group" role="group" aria-label="Stock availability filter">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`cf-seg-btn ${stockFilter === 'all' ? 'active' : ''}`}
                >
                  All Books
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('in-stock')}
                  className={`cf-seg-btn ${stockFilter === 'in-stock' ? 'active' : ''}`}
                >
                  In Stock
                </button>
              </div>

              <div className="cf-seg-group" role="group" aria-label="Catalogue layout mode">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`cf-seg-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={14} aria-hidden="true" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`cf-seg-btn ${viewMode === 'list' ? 'active' : ''}`}
                  aria-label="List view"
                >
                  <List size={14} aria-hidden="true" />
                  <span>List</span>
                </button>
              </div>

              <button
                type="button"
                onClick={refetch}
                className="cf-btn cf-btn-secondary"
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'cf-spin' : ''} aria-hidden="true" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="cf-catalogue-search-row">
            <div className="cf-search-input-wrap">
              <Search size={17} className="cf-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="cf-input cf-input-pill cf-input-with-icon"
                placeholder="Search book by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search books by title or author"
              />
            </div>
          </div>

          {loading ? (
            <div className="cf-card">
              <LoadingSpinner message="Loading available books..." />
            </div>
          ) : error ? (
            <ErrorMessage
              title="Could not load book catalogue"
              message={error}
              onRetry={refetch}
            />
          ) : (
            <BookList
              books={filteredBooks}
              cartItems={items}
              onAddToCart={addItem}
              viewMode={viewMode}
            />
          )}
        </div>

        <CartSummary
          items={items}
          estimatedTotal={estimatedTotal}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          showCheckoutButton
        />
      </div>

      {/* 5. "What Happens With Every Order" 2-Column Split */}
      <section className="cf-inside-section" aria-label="Order processing steps overview">
        <div>
          <p className="cf-meta-line" style={{ marginBottom: 6 }}>Step-by-Step Transparency</p>
          <h2 className="cf-section-display">What happens inside every order</h2>
          <p className="cf-section-lead" style={{ marginTop: 8 }}>
            Once you submit checkout, your order progresses sequentially through six recorded stages so you always know exactly where things stand.
          </p>

          <div className="cf-inside-checklist">
            {ORDER_STEPS_GUIDE.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="cf-inside-item">
                  <div className="cf-inside-icon" aria-hidden="true">
                    <Icon size={15} />
                  </div>
                  <div>
                    <h3 className="cf-inside-item-title">{step.title}</h3>
                    <p className="cf-inside-item-desc">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cf-inside-visual">
          <OrderPreviewVisual />
        </div>
      </section>

      {/* 6. Rounded Bottom CTA Banner */}
      <section className="cf-bottom-cta-banner" aria-label="Ready to place an order">
        <div className="cf-bottom-cta-content">
          <p className="cf-hero-kicker">Ready When You Are</p>
          <h2 className="cf-section-display" style={{ color: '#ffffff', marginBottom: 10 }}>
            Start your next book order today
          </h2>
          <p style={{ margin: '0 0 22px', color: 'rgba(255, 255, 255, 0.86)', fontSize: '0.95rem' }}>
            {items.length > 0
              ? `You currently have ${items.reduce((acc, i) => acc + i.quantity, 0)} book(s) selected and ready for checkout.`
              : 'Pick your favorite titles from the catalogue above or check an existing order status.'}
          </p>

          <div className="cf-hero-cta-row" style={{ marginBottom: 0 }}>
            {items.length > 0 ? (
              <Link to="/checkout" className="cf-hero-white-btn">
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={scrollToCatalogue}
                className="cf-hero-white-btn"
              >
                <span>Explore Catalogue</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="cf-bottom-cta-arch" aria-hidden="true">
          <BottomShelfIllustration />
        </div>
      </section>
    </div>
  );
}
