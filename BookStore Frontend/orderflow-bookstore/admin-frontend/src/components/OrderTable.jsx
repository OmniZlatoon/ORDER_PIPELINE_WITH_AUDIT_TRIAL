import { ArrowRight, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
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

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

export default function OrderTable({ orders = [] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="af-empty">
        <Inbox size={28} color="#64748b" aria-hidden="true" />
        <h3 className="af-empty-title">No orders match the current view</h3>
        <p className="af-empty-text" style={{ marginBottom: 0 }}>
          Adjust your search or status filters, or look up a specific order by ID or reference.
        </p>
      </div>
    );
  }

  return (
    <div className="af-table-wrap">
      <table className="af-table">
        <thead>
          <tr>
            <th>Order Reference</th>
            <th>Customer</th>
            <th>Total Amount</th>
            <th>Order Status</th>
            <th>Payment Status</th>
            <th>Created Date</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.orderId}>
              <td className="af-mono" style={{ fontWeight: 600 }}>
                {order.orderReference || `#${order.orderId}`}
              </td>
              <td>{order.customerName || order.customer?.fullName || '—'}</td>
              <td className="af-mono" style={{ fontWeight: 600 }}>
                {formatCurrency(order.totalAmount)}
              </td>
              <td>
                <StatusBadge status={order.orderStatus} />
              </td>
              <td>
                <StatusBadge status={order.paymentStatus} />
              </td>
              <td className="af-mono" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                {formatDate(order.createdAt)}
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', gap: 8 }}>
                  <Link to={`/admin/orders/${order.orderId}`} className="af-btn af-btn-secondary" style={{ minHeight: 34, padding: '6px 12px', fontSize: '0.8125rem' }}>
                    <span>Details</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                  <Link to={`/admin/orders/${order.orderId}/audit`} className="af-btn af-btn-secondary" style={{ minHeight: 34, padding: '6px 12px', fontSize: '0.8125rem' }}>
                    Activity
                  </Link>
                  <Link to={`/admin/orders/${order.orderId}/notifications`} className="af-btn af-btn-secondary" style={{ minHeight: 34, padding: '6px 12px', fontSize: '0.8125rem' }}>
                    Notifications
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
