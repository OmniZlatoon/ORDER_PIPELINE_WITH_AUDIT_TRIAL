import { Bell, FileText, GitCommitHorizontal, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import AuditTimeline from '../components/AuditTimeline';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderSummary from '../components/OrderSummary';
import { useAuditHistory } from '../hooks/useAuditHistory';
import { useOrder } from '../hooks/useOrder';

export default function AuditHistoryPage() {
  const { orderId } = useParams();
  const { order, loading: orderLoading, error: orderError } = useOrder(orderId);
  const { auditEvents, loading: auditLoading, error: auditError, refetch } = useAuditHistory(orderId);

  const [stepFilter, setStepFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const uniqueSteps = useMemo(() => {
    const set = new Set(auditEvents.map((e) => e.stepName).filter(Boolean));
    return Array.from(set);
  }, [auditEvents]);

  const filteredEvents = useMemo(() => {
    return auditEvents.filter((event) => {
      const matchesStep = stepFilter === 'ALL' || event.stepName === stepFilter;
      const matchesStatus =
        statusFilter === 'ALL' || String(event.executionStatus).toUpperCase() === statusFilter;
      return matchesStep && matchesStatus;
    });
  }, [auditEvents, stepFilter, statusFilter]);

  return (
    <div className="af-stack">
      <header className="af-page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="af-page-title">
            Activity History {order?.orderReference ? `— ${order.orderReference}` : `— #${orderId}`}
          </h1>
          <p className="af-page-subtitle">
            View-only step-by-step activity log recorded for this order.
          </p>
        </div>

        <button type="button" onClick={refetch} className="af-btn af-btn-secondary" disabled={auditLoading}>
          <RefreshCw size={15} className={auditLoading ? 'af-spin' : ''} aria-hidden="true" />
          <span>Refresh Activity Log</span>
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

      <section className="af-card" aria-label="Activity record filters">
        <div className="af-filter-row" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--af-text-secondary)' }}>
            Filter Step:
            <select
              className="af-select"
              style={{ marginLeft: 8 }}
              value={stepFilter}
              onChange={(e) => setStepFilter(e.target.value)}
            >
              <option value="ALL">All Steps</option>
              {uniqueSteps.map((step) => (
                <option key={step} value={step}>
                  {step}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--af-text-secondary)' }}>
            Status:
            <select
              className="af-select"
              style={{ marginLeft: 8 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="STARTED">STARTED</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>
          </label>
        </div>
      </section>

      {auditError ? (
        <ErrorMessage title="Unable to load activity history" message={auditError} onRetry={refetch} />
      ) : auditLoading ? (
        <div className="af-card">
          <LoadingSpinner message={`Loading activity history for order #${orderId}...`} />
        </div>
      ) : (
        <AuditTimeline auditEvents={filteredEvents} showOrderId />
      )}
    </div>
  );
}
