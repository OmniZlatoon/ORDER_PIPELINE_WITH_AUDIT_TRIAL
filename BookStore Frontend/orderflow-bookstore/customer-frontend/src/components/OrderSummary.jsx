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

export default function OrderSummary({ order, customerEmailFallback }) {
  if (!order) {
    return null;
  }

  const displayCustomerName = order.customerName || order.customer?.fullName || '—';
  const displayEmail = order.customerEmail || order.email || order.customer?.email || customerEmailFallback || '—';

  return (
    <section className="cf-card" aria-label="Order summary">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div className="cf-meta-line">
            <span className="cf-mono">Order #{order.orderId}</span>
            <span aria-hidden="true">·</span>
            <span>Confirmed Order Details</span>
          </div>
          <h2 className="cf-section-title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>
            {order.orderReference || `Order #${order.orderId}`}
          </h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <StatusBadge status={order.orderStatus} label={`Order: ${order.orderStatus || 'UNKNOWN'}`} />
          <StatusBadge status={order.paymentStatus} label={`Payment: ${order.paymentStatus || 'UNKNOWN'}`} />
        </div>
      </div>

      <div className="cf-summary-grid">
        <div>
          <div className="cf-stat-label">Customer Name</div>
          <div className="cf-stat-value">{displayCustomerName}</div>
        </div>
        <div>
          <div className="cf-stat-label">Customer Email</div>
          <div className="cf-stat-value">{displayEmail}</div>
        </div>
        <div>
          <div className="cf-stat-label">Total Amount</div>
          <div className="cf-stat-value cf-mono">{formatCurrency(order.totalAmount)}</div>
        </div>
        <div>
          <div className="cf-stat-label">Order Reference</div>
          <div className="cf-stat-value cf-mono">{order.orderReference || '—'}</div>
        </div>
        <div>
          <div className="cf-stat-label">Created At</div>
          <div className="cf-stat-value cf-mono">{formatDateTime(order.createdAt)}</div>
        </div>
        <div>
          <div className="cf-stat-label">Completed At</div>
          <div className="cf-stat-value cf-mono">
            {order.completedAt ? formatDateTime(order.completedAt) : 'Not completed'}
          </div>
        </div>
        <div>
          <div className="cf-stat-label">Final Order Status</div>
          <div className="cf-stat-value">{order.orderStatus || '—'}</div>
        </div>
        <div>
          <div className="cf-stat-label">Payment Status</div>
          <div className="cf-stat-value">{order.paymentStatus || '—'}</div>
        </div>
      </div>
    </section>
  );
}
