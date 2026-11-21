import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrderAuditHistory } from '../api/auditApi';
import { extractApiError } from '../api/axiosClient';
import { fetchOrderNotifications } from '../api/notificationApi';
import { lookupOrder } from '../api/orderApi';
import AuditTimeline from '../components/AuditTimeline';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationTable from '../components/NotificationTable';
import OrderSearchBar from '../components/OrderSearchBar';
import OrderSummary from '../components/OrderSummary';
import PipelineTimeline from '../components/PipelineTimeline';

export default function OrderLookupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const handleLookup = async (query) => {
    setLoading(true);
    setError(null);
    setOrder(null);
    setAuditEvents([]);
    setNotifications([]);

    try {
      const found = await lookupOrder(query);
      setOrder(found);

      const [auditRes, notifRes] = await Promise.allSettled([
        fetchOrderAuditHistory(found.orderId),
        fetchOrderNotifications(found.orderId),
      ]);

      if (auditRes.status === 'fulfilled') {
        const sorted = [...auditRes.value].sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tA !== tB ? tA - tB : (Number(a.auditId) || 0) - (Number(b.auditId) || 0);
        });
        setAuditEvents(sorted);
      }

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value);
      }
    } catch (err) {
      const normalized = extractApiError(err, `No order found matching "${query}".`);
      setError(normalized.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="af-stack">
      <header className="af-page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="af-page-title">Administrator Order Lookup</h1>
          <p className="af-page-subtitle">
            Find any order by Order ID or Order Reference to view its progress, activity history, and notifications.
          </p>
        </div>
      </header>

      <section className="af-card">
        <OrderSearchBar onSearch={handleLookup} loading={loading} buttonLabel="Search Order" />
      </section>

      {loading ? (
        <div className="af-card">
          <LoadingSpinner message="Searching for order details, activity history, and notifications..." />
        </div>
      ) : null}

      {error ? <ErrorMessage title="Order lookup failed" message={error} /> : null}

      {!loading && !error && !order ? (
        <div className="af-empty">
          <Search size={28} color="#64748b" aria-hidden="true" />
          <h2 className="af-empty-title">Enter an Order ID or Reference</h2>
          <p className="af-empty-text" style={{ marginBottom: 0 }}>
            View real-time progress and notification history for completed, failed, or in-progress orders.
          </p>
        </div>
      ) : null}

      {order ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link to={`/admin/orders/${order.orderId}`} className="af-btn af-btn-primary">
              <span>Open Full Order Details</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to={`/admin/orders/${order.orderId}/audit`} className="af-btn af-btn-secondary">
              Open Activity History
            </Link>
            <Link to={`/admin/orders/${order.orderId}/notifications`} className="af-btn af-btn-secondary">
              Open Notification Details
            </Link>
          </div>

          <OrderSummary order={order} />
          <PipelineTimeline auditEvents={auditEvents} orderStatus={order.orderStatus} />
          <NotificationTable notifications={notifications} />
          <AuditTimeline auditEvents={auditEvents} showOrderId />
        </>
      ) : null}
    </div>
  );
}
