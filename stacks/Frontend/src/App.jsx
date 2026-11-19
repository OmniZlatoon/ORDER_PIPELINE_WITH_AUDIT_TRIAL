import { useEffect, useMemo, useState } from "react";
import { createOrder, getBooks, getOrderAudit, getOrderNotifications } from "./api.js";

const STAGES = [
  "Validate Order",
  "Check Inventory",
  "Calculate Total",
  "Process Payment",
  "Confirm Order",
  "Complete Order",
];

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

function App() {
  const [books, setBooks] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [customer, setCustomer] = useState({ fullName: "", email: "" });
  const [result, setResult] = useState(null);
  const [audit, setAudit] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBooks()
      .then(setBooks)
      .catch((cause) => setError(cause.message))
      .finally(() => setLoadingBooks(false));
  }, []);

  const selectedItems = useMemo(
    () => books
      .filter((book) => Number(quantities[book.id] ?? 0) > 0)
      .map((book) => ({ bookId: book.id, quantity: Number(quantities[book.id]) })),
    [books, quantities],
  );

  async function submitOrder(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setSubmitting(true);

    try {
      const order = await createOrder({ customer, items: selectedItems });
      const [auditEvents, notificationRecords] = await Promise.all([
        getOrderAudit(order.orderId),
        getOrderNotifications(order.orderId),
      ]);
      setResult(order);
      setAudit(auditEvents);
      setNotifications(notificationRecords);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateQuantity(bookId, value) {
    setQuantities((current) => ({ ...current, [bookId]: value }));
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Page top">
          <span className="brand-mark">O</span>
          <span>ORDER<span className="brand-light">FLOW</span></span>
        </a>
        <span className="topbar-note"><span className="live-dot" /> BOOKSHOP SYSTEM</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">A BOOKSHOP, BUILT AROUND TRUST</p>
          <h1>Every order has<br />a story to tell.</h1>
          <p className="hero-description">
            Choose a book and follow its journey through a transparent,
            carefully audited order pipeline.
          </p>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>THE ORDER</span><strong>✳</strong><span>PIPELINE</span>
        </div>
      </section>

      <div className="workspace">
        <section className="catalog-panel panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE COLLECTION</p>
              <h2>Find your next read</h2>
            </div>
            <span className="count-pill">{books.length} BOOKS</span>
          </div>

          {loadingBooks ? (
            <p className="muted-message">Loading the catalogue…</p>
          ) : books.length === 0 ? (
            <p className="muted-message">No books are available yet. Check the database seed data.</p>
          ) : (
            <div className="book-grid">
              {books.map((book, index) => (
                <article className="book-card" key={book.id}>
                  <div className={`book-cover cover-${index % 5}`} aria-hidden="true">
                    <span className="cover-rule" />
                    <span className="cover-title">{book.title}</span>
                    <span className="cover-author">{book.author}</span>
                    <span className="cover-number">VOL. {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="book-info">
                    <div className="book-title-row">
                      <h3>{book.title}</h3>
                      <span className="stock-tag">{book.stockQuantity} in stock</span>
                    </div>
                    <p className="book-author">{book.author}</p>
                    <div className="book-buy-row">
                      <span className="book-price">{money.format(book.price)}</span>
                      <label className="quantity-control">
                        <span className="sr-only">Quantity of {book.title}</span>
                        <input
                          type="number"
                          min="0"
                          max={book.stockQuantity}
                          value={quantities[book.id] ?? 0}
                          onChange={(event) => updateQuantity(book.id, event.target.value)}
                          disabled={book.stockQuantity < 1}
                        />
                      </label>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="order-panel panel">
          <p className="eyebrow">YOUR DETAILS</p>
          <h2>Make it yours.</h2>
          <p className="form-intro">We’ll prepare your order and show each step as it happens.</p>
          <form onSubmit={submitOrder}>
            <label className="field-label" htmlFor="full-name">Full name</label>
            <input
              id="full-name"
              autoComplete="name"
              required
              value={customer.fullName}
              onChange={(event) => setCustomer({ ...customer, fullName: event.target.value })}
              placeholder="Your name"
            />
            <label className="field-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={customer.email}
              onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
              placeholder="you@example.com"
            />

            <div className="order-summary">
              <span>Selected titles</span>
              <strong>{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            </div>
            <button className="submit-button" type="submit" disabled={submitting || selectedItems.length === 0}>
              {submitting ? "Processing order…" : "Place order"}
              <span aria-hidden="true">↗</span>
            </button>
            <p className="secure-note">Payment, shipping and email are simulated for this demonstration.</p>
          </form>
        </aside>
      </div>

      {error && <div className="alert error-alert" role="alert">{error}</div>}

      {result && (
        <section className="monitor panel" aria-live="polite">
          <div className="section-heading monitor-heading">
            <div>
              <p className="eyebrow">ORDER PROCESSING MONITOR</p>
              <h2>Here’s the journey.</h2>
            </div>
            <span className={`status-pill status-${result.orderStatus.toLowerCase()}`}>
              {result.orderStatus}
            </span>
          </div>

          <div className="result-summary">
            <div><span>REFERENCE</span><strong>{result.orderReference}</strong></div>
            <div><span>ORDER TOTAL</span><strong>{money.format(result.totalAmount)}</strong></div>
            <div><span>PAYMENT</span><strong>{result.paymentStatus}</strong></div>
          </div>

          <div className="monitor-columns">
            <div className="timeline-section">
              <h3>Six-stage pipeline</h3>
              <ol className="timeline">
                {STAGES.map((stage, index) => {
                  const events = audit.filter((entry) => entry.stepName === stage);
                  const failed = events.some((entry) => entry.executionStatus === "FAILED");
                  const succeeded = events.some((entry) => entry.executionStatus === "SUCCESS");
                  const started = events.find((entry) => entry.executionStatus === "STARTED");
                  const failureIndex = STAGES.findIndex((name) =>
                    audit.some((entry) => entry.stepName === name && entry.executionStatus === "FAILED"));
                  const status = failed
                    ? "FAILED"
                    : succeeded
                      ? "SUCCESS"
                      : failureIndex !== -1 && index > failureIndex
                        ? "NOT EXECUTED"
                        : started
                          ? "IN PROGRESS"
                          : "NOT RUN";
                  const endEvent = events.find((entry) =>
                    entry.executionStatus === "SUCCESS" || entry.executionStatus === "FAILED");
                  return (
                    <li className={`timeline-item timeline-${status.toLowerCase().replaceAll(" ", "-")}`} key={stage}>
                      <span className="timeline-index">{String(index + 1).padStart(2, "0")}</span>
                      <div className="timeline-content">
                        <strong>{stage}</strong>
                        <span>{status}</span>
                        {(started || endEvent) && (
                          <time>{new Date((endEvent ?? started).createdAt).toLocaleString()}</time>
                        )}
                      </div>
                      <span className="timeline-mark" aria-hidden="true">{succeeded ? "✓" : failed ? "!" : "·"}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="activity-section">
              <div>
                <h3>Observer outcomes</h3>
                <div className="observer-list">
                  {["SHIPPING", "EMAIL"].map((type) => {
                    const record = notifications.find((item) => item.notificationType === type);
                    return (
                      <div className="observer-card" key={type}>
                        <span className={`observer-icon ${record ? "observer-active" : ""}`}>
                          {type === "SHIPPING" ? "↗" : "✉"}
                        </span>
                        <div>
                          <strong>{type === "SHIPPING" ? "Shipping observer" : "Email observer"}</strong>
                          <span>{record ? `${record.status} · ${record.message}` : "NOT TRIGGERED"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="audit-section">
                <div className="audit-heading">
                  <h3>Audit history</h3>
                  <span>{audit.length} EVENTS</span>
                </div>
                <ol className="audit-list">
                  {audit.map((entry) => (
                    <li key={entry.auditId}>
                      <time>{new Date(entry.createdAt).toLocaleTimeString()}</time>
                      <span className={`audit-status audit-${entry.executionStatus.toLowerCase()}`}>
                        {entry.executionStatus}
                      </span>
                      <span className="audit-description">{entry.stepName} — {entry.message}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="footer">
        <span>ORDERFLOW BOOKSHOP</span>
        <span>One order. Six steps. A complete story.</span>
      </footer>
    </main>
  );
}

export default App;
