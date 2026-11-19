import { Bell, FileText, GitCommitHorizontal, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { extractApiError } from '../api/axiosClient';
import { lookupOrder } from '../api/orderApi';
import AuditTimeline from '../components/AuditTimeline';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationTable from '../components/NotificationTable';
import OrderSearchBar from '../components/OrderSearchBar';
import OrderSummary from '../components/OrderSummary';
import PipelineTimeline from '../components/PipelineTimeline';
import { useAuditHistory } from '../hooks/useAuditHistory';
import { useNotifications } from '../hooks/useNotifications';
import { useOrder } from '../hooks/useOrder';

export default function OrderProcessingMonitorPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { order, loading: orderLoading, error: orderError, refetch: refetchOrder } = useOrder(orderId);
  const { auditEvents, loading: auditLoading, error: auditError, refetch: refetchAudit } = useAuditHistory(orderId);
  const { notifications, loading: notifLoading, error: notifError, refetch: refetchNotifications } = useNotifications(orderId);

  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState(null);

  const handleSwitchOrder = async (query) => {
    setSwitchLoading(true);
    setSwitchError(null);
    try {
      const found = await lookupOrder(query);
      navigate(`/admin/orders/${found.orderId}`);
    } catch (err) {
      const normalized = extractApiError(err, `No order found matching "${query}".`);
      setSwitchError(normalized.message);
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleRefreshAll = () => {
    refetchOrder();
    refetchAudit();
    refetchNotifications();
  };

  const isAnyLoading = orderLoading || auditLoading || notifLoading;

  return (
    <div className="af-stack">
      <header className="af-page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="af-page-title">
            Order Progress &amp; Details {order?.orderReference ? `— ${order.orderReference}` : `— #${orderId}`}
          </h1>
          <p className="af-page-subtitle">
            Complete six-step order progress, activity history, and customer notifications.
          </p>
        </div>

        <button type="button" onClick={handleRefreshAll} className="af-btn af-btn-secondary" disabled={isAnyLoading}>
          <RefreshCw size={15} className={isAnyLoading ? 'af-spin' : ''} aria-hidden="true" />
          <span>Refresh Order Data</span>
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

      <section className="af-card" aria-label="Switch monitored order">
        <OrderSearchBar
          initialQuery={orderId}
          onSearch={handleSwitchOrder}
          loading={switchLoading}
          buttonLabel="Load Order"
        />
        {switchError ? (
          <div style={{ marginTop: 12 }}>
            <ErrorMessage title="Order switch failed" message={switchError} />
          </div>
        ) : null}
      </section>

      {orderError ? (
        <ErrorMessage title="Unable to load order summary" message={orderError} onRetry={handleRefreshAll} />
      ) : orderLoading ? (
        <div className="af-card">
          <LoadingSpinner message={`Loading order #${orderId}...`} />
        </div>
      ) : (
        <OrderSummary order={order} />
      )}

      {auditError ? (
        <ErrorMessage title="Unable to load order progress" message={auditError} onRetry={refetchAudit} />
      ) : auditLoading ? (
        <div className="af-card">
          <LoadingSpinner message="Loading order progress..." />
        </div>
      ) : (
        <PipelineTimeline auditEvents={auditEvents} orderStatus={order?.orderStatus} />
      )}

      {notifError ? (
        <ErrorMessage title="Unable to load customer notifications" message={notifError} onRetry={refetchNotifications} />
      ) : notifLoading ? (
        <div className="af-card">
          <LoadingSpinner message="Loading shipping and email notifications..." />
        </div>
      ) : (
        <NotificationTable notifications={notifications} />
      )}

      {!auditLoading && !auditError ? <AuditTimeline auditEvents={auditEvents} showOrderId /> : null}
    </div>
  );
}
