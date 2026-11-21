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

function formatXaf(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '—';
  }
  return `XAF ${Number(amount).toLocaleString()}`;
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
          <div className="cf-stat-label">Payment Amount (XAF)</div>
          <div className="cf-stat-value cf-mono">{formatXaf(order.paymentAmountXaf)}</div>
        </div>
        {order.exchangeRateUsdXaf ? (
          <div>
            <div className="cf-stat-label">USD/XAF Rate</div>
            <div className="cf-stat-value cf-mono">
              {Number(order.exchangeRateUsdXaf).toLocaleString()} XAF per USD
            </div>
          </div>
        ) : null}
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

      {Array.isArray(order.items) && order.items.length > 0 ? (
        <div className="cf-order-lines">
          <h3 className="cf-section-title">Books in this order</h3>
          <ul className="cf-cart-list">
            {order.items.map((item) => (
              <li key={item.bookId} className="cf-cart-item">
                <div className="cf-cart-item-top">
                  <div>
                    <p className="cf-cart-item-title">{item.title}</p>
                    <span className="cf-cart-item-sub">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                      {item.author ? ` · ${item.author}` : ''}
                    </span>
                  </div>
                  <span className="cf-cart-line-total">{formatCurrency(item.lineTotal)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
