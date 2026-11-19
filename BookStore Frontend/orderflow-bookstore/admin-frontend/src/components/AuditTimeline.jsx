import { FileText } from 'lucide-react';
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

export default function AuditTimeline({ auditEvents = [], showOrderId = false }) {
  return (
    <section className="af-card" aria-label="View-only order activity history">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h2 className="af-section-title">Order Activity History (View Only)</h2>
          <p className="af-section-desc" style={{ marginBottom: 0 }}>
            Complete step-by-step record of every check and action taken for this order.
          </p>
        </div>
        <span className="af-mono" style={{ fontSize: '0.8rem', color: 'var(--af-text-muted)' }}>
          {auditEvents.length} record{auditEvents.length === 1 ? '' : 's'}
        </span>
      </div>

      {!auditEvents || auditEvents.length === 0 ? (
        <div className="af-empty">
          <FileText size={26} color="#64748b" aria-hidden="true" />
          <h3 className="cf-empty-title">No activity records available</h3>
          <p className="af-empty-text" style={{ marginBottom: 0 }}>
            No activity records match the selected order or filter.
          </p>
        </div>
      ) : (
        <div className="af-table-wrap">
          <table className="af-table">
            <thead>
              <tr>
                <th>Record ID</th>
                {showOrderId ? <th>Order ID</th> : null}
                <th>Order Step</th>
                <th>Status</th>
                <th>Details</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((event, index) => (
                <tr key={event.auditId ?? `${event.stepName}-${index}`}>
                  <td className="af-mono">#{event.auditId ?? index + 1}</td>
                  {showOrderId ? <td className="af-mono">#{event.orderId}</td> : null}
                  <td style={{ fontWeight: 600 }}>{event.stepName}</td>
                  <td>
                    <StatusBadge status={event.executionStatus} />
                  </td>
                  <td>{event.message || '—'}</td>
                  <td className="af-mono" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    {formatTimestamp(event.createdAt)}
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
