import StatusBadge from './StatusBadge';

function formatCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '—';
  }
  return `$${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

export default function OrderSummary({ order }) {
  if (!order) {
    return null;
  }

  return (
    <section className="af-card" aria-label="Order summary">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <div className="af-mono" style={{ fontSize: '0.78rem', color: 'var(--af-text-muted)', marginBottom: 4 }}>
            Order ID #{order.orderId}
          </div>
          <h2 className="af-section-title" style={{ fontSize: '1.35rem', marginBottom: 0 }}>
            {order.orderReference || `Order #${order.orderId}`}
          </h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <StatusBadge status={order.orderStatus} label={`Order: ${order.orderStatus || 'UNKNOWN'}`} />
          <StatusBadge status={order.paymentStatus} label={`Payment: ${order.paymentStatus || 'UNKNOWN'}`} />
        </div>
      </div>

      <div className="af-summary-grid">
        <div>
          <div className="af-stat-label">Customer Name</div>
          <div className="af-stat-value">{order.customerName || order.customer?.fullName || '—'}</div>
        </div>
        <div>
          <div className="af-stat-label">Total Amount</div>
          <div className="af-stat-value af-mono">{formatCurrency(order.totalAmount)}</div>
        </div>
        <div>
          <div className="af-stat-label">Created At</div>
          <div className="af-stat-value af-mono">{formatDateTime(order.createdAt)}</div>
        </div>
        <div>
          <div className="af-stat-label">Completed At</div>
          <div className="af-stat-value af-mono">
            {order.completedAt ? formatDateTime(order.completedAt) : 'Not completed'}
          </div>
        </div>
      </div>
    </section>
  );
}
