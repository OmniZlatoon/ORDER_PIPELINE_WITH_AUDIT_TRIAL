import { BellOff, Mail, Truck } from 'lucide-react';
import StatusBadge from './StatusBadge';

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function ObserverSummaryBox({ title, observerLabel, Icon, records }) {
  const count = records.length;
  const primary = records[0] || null;

  return (
    <div className="af-observer-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={18} color="var(--af-accent)" aria-hidden="true" />
          <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 700 }}>{title}</h3>
        </div>
        {primary ? (
          <StatusBadge status={primary.status} />
        ) : (
          <StatusBadge status="NOT EXECUTED" label="NOT SENT" />
        )}
      </div>

      <p
        style={{
          margin: '0 0 6px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: count === 1 ? 'var(--af-success-text)' : count > 1 ? 'var(--af-warn-text)' : 'var(--af-text-muted)',
        }}
      >
        {count === 1
          ? `${observerLabel} notification: created and sent once.`
          : count > 1
            ? `${observerLabel} notification: ${count} records found.`
            : `${observerLabel} notification: not sent`}
      </p>

      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--af-text-secondary)' }}>
        {primary
          ? primary.message || 'Notification record created when the order completed.'
          : 'No notification created (sent only after an order finishes all steps).'}
      </p>
    </div>
  );
}

export default function NotificationTable({ notifications = [] }) {
  const shippingRecords = notifications.filter(
    (item) => String(item.notificationType).toUpperCase() === 'SHIPPING'
  );
  const emailRecords = notifications.filter(
    (item) => String(item.notificationType).toUpperCase() === 'EMAIL'
  );

  return (
    <section className="af-card" aria-label="View-only delivery and email notifications">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 className="af-section-title">Delivery &amp; Email Notifications (View Only)</h2>
          <p className="af-section-desc" style={{ marginBottom: 0 }}>
            Shipping preparation and email confirmation notices generated when an order completes.
          </p>
        </div>
        <span className="af-mono" style={{ fontSize: '0.8rem', color: 'var(--af-text-muted)' }}>
          {notifications.length} record{notifications.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="af-observer-grid">
        <ObserverSummaryBox
          title="Shipping Notification"
          observerLabel="Shipping"
          Icon={Truck}
          records={shippingRecords}
        />
        <ObserverSummaryBox
          title="Email Notification"
          observerLabel="Email"
          Icon={Mail}
          records={emailRecords}
        />
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="af-empty">
          <BellOff size={26} color="#64748b" aria-hidden="true" />
          <h3 className="af-empty-title">No notification records</h3>
          <p className="af-empty-text" style={{ marginBottom: 0 }}>
            Neither shipping nor email notifications were created for this order.
          </p>
        </div>
      ) : (
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Notification ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Message</th>
                <th>Attempts</th>
                <th>Created At</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((record, idx) => (
                <tr key={record.notificationId ?? `${record.notificationType}-${idx}`}>
                  <td className="af-mono">#{record.notificationId ?? idx + 1}</td>
                  <td>
                    <StatusBadge status={record.notificationType} />
                  </td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                  <td>{record.message || '—'}</td>
                  <td className="af-mono">{record.attempts ?? 0}</td>
                  <td className="af-mono" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    {formatTimestamp(record.createdAt)}
                  </td>
                  <td className="af-mono" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    {formatTimestamp(record.sentAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
