import { Bell, FileText, GitCommitHorizontal, RefreshCw } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationTable from '../components/NotificationTable';
import OrderSummary from '../components/OrderSummary';
import { useNotifications } from '../hooks/useNotifications';
import { useOrder } from '../hooks/useOrder';

export default function NotificationMonitorPage() {
  const { orderId } = useParams();
  const { order, loading: orderLoading, error: orderError } = useOrder(orderId);
  const { notifications, loading: notifLoading, error: notifError, refetch } = useNotifications(orderId);

  return (
    <div className="af-stack">
      <header className="af-page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="af-page-title">
            Notification Details {order?.orderReference ? `— ${order.orderReference}` : `— #${orderId}`}
          </h1>
          <p className="af-page-subtitle">
            View-only shipping and email notifications generated when an order completes.
          </p>
        </div>

        <button type="button" onClick={refetch} className="af-btn af-btn-secondary" disabled={notifLoading}>
          <RefreshCw size={15} className={notifLoading ? 'af-spin' : ''} aria-hidden="true" />
          <span>Refresh Notifications</span>
        </button>
      </header>

      <nav className="af-order-tabs" aria-label="Order inspection views" style={{ marginBottom: 0 }}>
        <NavLink to={`/admin/orders/${orderId}`} end className={({ isActive }) => `af-order-tab ${isActive ? 'active' : ''}`}>
          <GitCommitHorizontal size={15} aria-hidden="true" />
          <span>Order Progress</span>
        </NavLink>
        <NavLink to={`/admin/orders/${orderId}/audit`} className={({ isActive }) => `af-order-tab ${isActive ? 'active' : ''}`}>
          <FileText size={15} aria-hidden="true" />
          <span>Activity History</span>
        </NavLink>
        <NavLink to={`/admin/orders/${orderId}/notifications`} className={({ isActive }) => `af-order-tab ${isActive ? 'active' : ''}`}>
          <Bell size={15} aria-hidden="true" />
          <span>Notifications</span>
        </NavLink>
      </nav>

      {orderError ? (
        <ErrorMessage title="Unable to load order summary" message={orderError} />
      ) : orderLoading ? null : (
        <OrderSummary order={order} />
      )}

      {notifError ? (
        <ErrorMessage title="Unable to load notification records" message={notifError} onRetry={refetch} />
      ) : notifLoading ? (
        <div className="af-card">
          <LoadingSpinner message={`Loading notifications for order #${orderId}...`} />
        </div>
      ) : (
        <NotificationTable notifications={notifications} />
      )}
    </div>
  );
}
