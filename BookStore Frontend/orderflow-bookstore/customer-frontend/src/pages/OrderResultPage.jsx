import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import AuditTimeline from '../components/AuditTimeline';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import ObserverStatus from '../components/ObserverStatus';
import OrderSummary from '../components/OrderSummary';
import PipelineTimeline from '../components/PipelineTimeline';
import { useAuditHistory } from '../hooks/useAuditHistory';
import { useNotifications } from '../hooks/useNotifications';
import { useOrder } from '../hooks/useOrder';

export default function OrderResultPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const initialOrder = location.state?.initialOrder || null;
  const justSubmitted = Boolean(location.state?.justSubmitted);
  const customerEmail = location.state?.customerEmail || null;

  const {
    order,
    loading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = useOrder(orderId, initialOrder);

  const {
    auditEvents,
    loading: auditLoading,
    error: auditError,
    refetch: refetchAudit,
  } = useAuditHistory(orderId);

  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useNotifications(orderId);

  const isLoadingAny = orderLoading || auditLoading || notificationsLoading;

  const handleRefreshAll = () => {
    refetchOrder();
    refetchAudit();
    refetchNotifications();
  };

  const orderStatus = String(order?.orderStatus || '').toUpperCase();

  return (
    <div>
      <header className="cf-page-head">
        <div>
          <div className="cf-meta-line">
            <Link to="/" style={{ color: 'var(--cf-accent)', textDecoration: 'none', fontWeight: 600 }}>
              Catalogue
            </Link>
            <span aria-hidden="true">/</span>
            <span>Order Status</span>
          </div>
          <h1 className="cf-page-title">
            {order?.orderReference ? `Order ${order.orderReference}` : `Order #${orderId}`}
          </h1>
          <p className="cf-page-subtitle">
            Live view of your six order steps, activity log, and shipping and email notifications.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="cf-btn cf-btn-secondary"
            disabled={isLoadingAny}
          >
            <RefreshCw size={15} className={isLoadingAny ? 'cf-spin' : ''} aria-hidden="true" />
            <span>Refresh Status</span>
          </button>
          <Link to="/" className="cf-btn cf-btn-primary">
            Order More Books
          </Link>
        </div>
      </header>

      {orderError ? (
        <ErrorMessage
          title="Unable to retrieve order summary"
          message={orderError}
          onRetry={handleRefreshAll}
        />
      ) : null}

      {orderLoading && !order ? (
        <div className="cf-card">
          <LoadingSpinner message={`Loading order #${orderId}...`} />
        </div>
      ) : null}

      {order ? (
        <div className="cf-stack">
          {orderStatus === 'COMPLETED' ? (
            <div className="cf-alert cf-alert-success" role="status" style={{ marginBottom: 0 }}>
              <div className="cf-alert-content">
                <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <p className="cf-alert-title">
                    {justSubmitted ? 'Order submitted and completed' : 'Order completed successfully'}
                  </p>
                  <p className="cf-alert-text">
                    All six order steps succeeded, and both your shipping and confirmation email notifications were created.
                  </p>
                </div>
              </div>
            </div>
          ) : orderStatus === 'FAILED' ? (
            <div className="cf-alert cf-alert-error" role="alert" style={{ marginBottom: 0 }}>
              <div className="cf-alert-content">
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <p className="cf-alert-title">Order processing failed</p>
                  <p className="cf-alert-text">
                    Your order stopped at the step marked failed below. Later steps were skipped, and shipping or email notifications were not sent.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="cf-alert cf-alert-info" role="status" style={{ marginBottom: 0 }}>
              <div className="cf-alert-content">
                <Clock size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <p className="cf-alert-title">Order status: {orderStatus || 'PENDING'}</p>
                  <p className="cf-alert-text">
                    Use Refresh Status to check for the latest order progress and notifications.
                  </p>
                </div>
              </div>
            </div>
          )}

          <OrderSummary order={order} customerEmailFallback={customerEmail} />

          {auditError ? (
            <ErrorMessage
              title="Unable to load order activity"
              message={auditError}
              onRetry={refetchAudit}
            />
          ) : auditLoading ? (
            <div className="cf-card">
              <LoadingSpinner message="Loading order progress..." />
            </div>
          ) : (
            <PipelineTimeline auditEvents={auditEvents} orderStatus={order.orderStatus} />
          )}

          {notificationsError ? (
            <ErrorMessage
              title="Unable to load shipping and email notifications"
              message={notificationsError}
              onRetry={refetchNotifications}
            />
          ) : notificationsLoading ? (
            <div className="cf-card">
              <LoadingSpinner message="Loading shipping and email notifications..." />
            </div>
          ) : (
            <ObserverStatus notifications={notifications} />
          )}

          {!auditLoading && !auditError ? <AuditTimeline auditEvents={auditEvents} /> : null}
        </div>
      ) : null}
    </div>
  );
}
