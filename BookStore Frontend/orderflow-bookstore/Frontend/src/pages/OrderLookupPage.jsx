import { Search } from 'lucide-react';
import { useState } from 'react';
import { extractApiError } from '../api/axiosClient';
import { fetchOrderAuditHistory, fetchOrderNotifications } from '../api/auditApi';
import { lookupOrder } from '../api/orderApi';
import AuditTimeline from '../components/AuditTimeline';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import ObserverStatus from '../components/ObserverStatus';
import OrderSummary from '../components/OrderSummary';
import PipelineTimeline from '../components/PipelineTimeline';

export default function OrderLookupPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditError, setAuditError] = useState(null);
  const [notificationsError, setNotificationsError] = useState(null);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter an Order ID (e.g. 104) or Order Reference (e.g. ORD-2026-00104).');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);
    setAuditEvents([]);
    setNotifications([]);
    setAuditError(null);
    setNotificationsError(null);

    try {
      const foundOrder = await lookupOrder(trimmed);
      setOrder(foundOrder);

      const targetId = foundOrder.orderId;
      const [auditRes, notifRes] = await Promise.allSettled([
        fetchOrderAuditHistory(targetId),
        fetchOrderNotifications(targetId),
      ]);

      if (auditRes.status === 'fulfilled') {
        const sorted = [...auditRes.value].sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tA !== tB ? tA - tB : (Number(a.auditId) || 0) - (Number(b.auditId) || 0);
        });
        setAuditEvents(sorted);
      } else {
        setAuditError(extractApiError(
          auditRes.reason,
          'Unable to load activity history for this order.'
        ).message);
      }

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value);
      } else {
        setNotificationsError(extractApiError(
          notifRes.reason,
          'Unable to load notifications for this order.'
        ).message);
      }
    } catch (err) {
      const normalized = extractApiError(err, `No order found for "${trimmed}".`);
      setError(normalized.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="cf-page-head">
        <div>
          <div className="cf-meta-line">
            <span>Order Tracking</span>
            <span aria-hidden="true">·</span>
            <span>Status &amp; Notifications</span>
          </div>
          <h1 className="cf-page-title">Order Lookup</h1>
          <p className="cf-page-subtitle">
            Enter your Order ID or Order Reference to check your order status, step-by-step progress, and shipping or email updates.
          </p>
        </div>
      </header>

      <form className="cf-card" onSubmit={handleSearch} style={{ marginBottom: 28 }}>
        <label htmlFor="order-lookup-input" className="cf-label">
          Order ID or Order Reference
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div className="cf-search-input-wrap" style={{ maxWidth: 'none', flex: 1 }}>
            <Search size={16} className="cf-search-icon" aria-hidden="true" />
            <input
              id="order-lookup-input"
              type="text"
              className="cf-input cf-input-pill cf-input-with-icon"
              placeholder="e.g. 104 or ORD-2026-00104"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="cf-btn cf-btn-primary" disabled={loading}>
            <Search size={16} aria-hidden="true" />
            <span>{loading ? 'Searching...' : 'Look Up Order'}</span>
          </button>
        </div>
      </form>

      {loading ? (
        <div className="cf-card">
          <LoadingSpinner message="Looking up your order details and notifications..." />
        </div>
      ) : null}

      {error ? (
        <ErrorMessage title="Order lookup failed" message={error} />
      ) : null}

      {!loading && !error && !order ? (
        <div className="cf-empty">
          <Search size={30} color="#71717a" aria-hidden="true" />
          <h2 className="cf-empty-title">Search for an existing order</h2>
          <p className="cf-empty-text" style={{ marginBottom: 0 }}>
            Enter your Order ID or Order Reference to view your order progress and notification status.
          </p>
        </div>
      ) : null}

      {order ? (
        <div className="cf-stack">
          <OrderSummary order={order} />
          <PipelineTimeline auditEvents={auditEvents} orderStatus={order.orderStatus} />
          {auditError ? (
            <ErrorMessage title="Unable to load order activity" message={auditError} />
          ) : null}
          {notificationsError ? (
            <ErrorMessage
              title="Unable to load shipping and email notifications"
              message={notificationsError}
            />
          ) : null}
          <ObserverStatus notifications={notifications} />
          <AuditTimeline auditEvents={auditEvents} />
        </div>
      ) : null}
    </div>
  );
}
