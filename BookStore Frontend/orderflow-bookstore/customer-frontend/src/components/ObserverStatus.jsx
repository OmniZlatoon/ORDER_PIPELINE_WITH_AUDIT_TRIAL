import { Mail, Truck } from 'lucide-react';
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

function ObserverCard({ title, Icon, observerName, records }) {
  const count = records.length;
  const primary = records[0] || null;

  let outcomeText = `${observerName} notification: not sent`;
  let outcomeColor = 'var(--cf-text-muted)';

  if (count === 1) {
    outcomeText = `${observerName} notification: created and sent once.`;
    outcomeColor = 'var(--cf-success-text)';
  } else if (count > 1) {
    outcomeText = `${observerName} notification: ${count} records found.`;
    outcomeColor = 'var(--cf-warn-text)';
  }

  return (
    <div className="cf-observer-card">
      <div className="cf-observer-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon size={18} color="var(--cf-accent)" aria-hidden="true" />
          <h3 className="cf-observer-title">{title}</h3>
        </div>
        {primary ? (
          <StatusBadge status={primary.status} />
        ) : (
          <StatusBadge status="NOT EXECUTED" label="NOT SENT" />
        )}
      </div>

      <p className="cf-observer-outcome" style={{ color: outcomeColor }}>
        {outcomeText}
      </p>

      {primary ? (
        <>
          <p style={{ fontSize: '0.875rem', color: 'var(--cf-text-secondary)', margin: '0 0 12px' }}>
            {primary.message || 'Notification created automatically when the order completed.'}
          </p>
          <div className="cf-observer-details">
            <div>
              <div className="cf-stat-label">Notification ID</div>
              <div className="cf-mono">#{primary.notificationId ?? '—'}</div>
            </div>
            <div>
              <div className="cf-stat-label">Delivery Attempts</div>
              <div className="cf-mono">{primary.attempts ?? 0}</div>
            </div>
            <div>
              <div className="cf-stat-label">Created At</div>
              <div className="cf-mono">{formatTimestamp(primary.createdAt)}</div>
            </div>
            <div>
              <div className="cf-stat-label">Sent At</div>
              <div className="cf-mono">{formatTimestamp(primary.sentAt)}</div>
            </div>
          </div>
        </>
      ) : (
        <p style={{ fontSize: '0.84rem', color: 'var(--cf-text-muted)', margin: 0 }}>
          Notifications are only sent after every order step is completed.
        </p>
      )}
    </div>
  );
}

export default function ObserverStatus({ notifications = [] }) {
  const shippingRecords = notifications.filter(
    (item) => String(item.notificationType).toUpperCase() === 'SHIPPING'
  );
  const emailRecords = notifications.filter(
    (item) => String(item.notificationType).toUpperCase() === 'EMAIL'
  );

  return (
    <section className="cf-card" aria-label="Shipping and email notifications">
      <h2 className="cf-section-title">Shipping &amp; Email Notifications</h2>
      <p className="cf-section-desc" style={{ marginBottom: 0 }}>
        Once an order is completed, shipping preparation and a confirmation email are automatically scheduled.
      </p>

      <div className="cf-observer-grid">
        <ObserverCard
          title="Shipping Notification"
          Icon={Truck}
          observerName="Shipping"
          records={shippingRecords}
        />
        <ObserverCard
          title="Email Notification"
          Icon={Mail}
          observerName="Email"
          records={emailRecords}
        />
      </div>
    </section>
  );
}
