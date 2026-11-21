import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { extractApiError } from '../api/axiosClient';
import { paymentLinkStorageKey, paymentReturnStorageKey } from '../api/paymentSession';
import { reconcilePayment } from '../api/orderApi';
import AuditTimeline from '../components/AuditTimeline';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import ObserverStatus from '../components/ObserverStatus';
import OrderSummary from '../components/OrderSummary';
import PaymentPanel from '../components/PaymentPanel';
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
  const [sessionPaymentLink, setSessionPaymentLink] = useState(null);
  const [paymentReturn, setPaymentReturn] = useState(Boolean(location.state?.paymentReturn));
  const [paymentError, setPaymentError] = useState(null);
  const [sessionWarning, setSessionWarning] = useState(null);

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
  const paymentPending = order?.orderStatus === 'PROCESSING'
    && order?.paymentStatus === 'PENDING';

  useEffect(() => {
    try {
      setSessionPaymentLink(window.sessionStorage.getItem(paymentLinkStorageKey(orderId)));
    } catch {
      setSessionWarning('This browser blocked session storage. Keep this page open while completing payment.');
    }

    if (initialOrder?.paymentLink) {
      setSessionPaymentLink(initialOrder.paymentLink);
      try {
        window.sessionStorage.setItem(paymentLinkStorageKey(orderId), initialOrder.paymentLink);
      } catch {
        setSessionWarning('This browser blocked session storage. Keep this page open while completing payment.');
      }
    }
  }, [initialOrder, orderId]);

  useEffect(() => {
    if (location.state?.paymentReturn) {
      setPaymentReturn(true);
      try {
        window.sessionStorage.setItem(paymentReturnStorageKey(orderId), 'true');
      } catch {
        setSessionWarning('Automatic payment checks may not resume after reloading this page.');
      }
      return;
    }

    try {
      setPaymentReturn(
        window.sessionStorage.getItem(paymentReturnStorageKey(orderId)) === 'true'
      );
    } catch {
      setSessionWarning('Automatic payment checks may not resume after reloading this page.');
    }
  }, [location.state, orderId]);

  const reconcileAndRefresh = useCallback(async () => {
    try {
      await reconcilePayment(orderId);
      setPaymentError(null);
    } catch (err) {
      const normalized = extractApiError(
        err,
        'Unable to verify the payment with Fapshi. The order remains pending until verified.'
      );
      setPaymentError(normalized.message);
    }

    await Promise.all([refetchOrder(), refetchAudit(), refetchNotifications()]);
  }, [orderId, refetchOrder, refetchAudit, refetchNotifications]);

  useEffect(() => {
    if (!paymentReturn || !paymentPending) {
      return undefined;
    }

    let active = true;
    let requestInFlight = false;
    const checkPayment = async () => {
      if (!active || requestInFlight) {
        return;
      }
      requestInFlight = true;
      try {
        await reconcileAndRefresh();
      } finally {
        requestInFlight = false;
      }
    };

    const initialCheckTimer = window.setTimeout(checkPayment, 0);
    const intervalId = window.setInterval(checkPayment, 20000);
    return () => {
      active = false;
      window.clearTimeout(initialCheckTimer);
      window.clearInterval(intervalId);
    };
  }, [paymentPending, paymentReturn, reconcileAndRefresh]);

  useEffect(() => {
    if (!order) {
      return;
    }
    const paymentStatus = String(order.paymentStatus || '').toUpperCase();
    const finalOrderStatus = String(order.orderStatus || '').toUpperCase();
    if (paymentStatus !== 'SUCCESS' && paymentStatus !== 'FAILED'
        && finalOrderStatus !== 'COMPLETED' && finalOrderStatus !== 'FAILED') {
      return;
    }

    try {
      window.sessionStorage.removeItem(paymentLinkStorageKey(orderId));
      window.sessionStorage.removeItem(paymentReturnStorageKey(orderId));
    } catch {
      setSessionWarning('The completed payment session could not be cleared from this browser.');
    }
  }, [order, orderId]);

  const handleRefreshAll = () => {
    if (paymentReturn && paymentPending) {
      void reconcileAndRefresh();
      return;
    }
    refetchOrder();
    refetchAudit();
    refetchNotifications();
  };

  const handleProceedToPayment = () => {
    const paymentLink = order?.paymentLink || initialOrder?.paymentLink || sessionPaymentLink;
    if (!paymentLink) {
      return;
    }
    try {
      window.sessionStorage.setItem(paymentReturnStorageKey(orderId), 'true');
      setPaymentReturn(true);
    } catch {
      setSessionWarning('Payment return tracking is unavailable; use Order Lookup if automatic verification does not resume.');
    }
    window.location.assign(paymentLink);
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
                    {paymentReturn
                      ? 'We are checking Fapshi for the verified payment result. Returning from the payment page alone does not confirm payment.'
                      : 'Use Refresh Status to check for the latest order progress and notifications.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <OrderSummary order={order} customerEmailFallback={customerEmail} />
          <PaymentPanel
            order={order}
            paymentLink={order.paymentLink || initialOrder?.paymentLink || sessionPaymentLink}
            onProceedToPayment={handleProceedToPayment}
            reconciliationError={paymentError}
            sessionWarning={sessionWarning}
          />

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
