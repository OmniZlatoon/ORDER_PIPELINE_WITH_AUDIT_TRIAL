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

export default function AuditTimeline({ auditEvents = [] }) {
  return (
    <section className="cf-card" aria-label="Order activity log">
      <h2 className="cf-section-title">Order Activity Log</h2>
      <p className="cf-section-desc" style={{ marginBottom: 0 }}>
        A step-by-step record of every check and action taken for this order.
      </p>

      {!auditEvents || auditEvents.length === 0 ? (
        <div className="cf-empty" style={{ marginTop: 18 }}>
          <FileText size={28} color="#71717a" aria-hidden="true" />
          <h3 className="cf-empty-title">No activity records found</h3>
          <p className="cf-empty-text" style={{ marginBottom: 0 }}>
            No activity details are available for this order yet.
          </p>
        </div>
      ) : (
        <div className="cf-table-wrap">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Order Step</th>
                <th>Status</th>
                <th>Details</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((event, idx) => (
                <tr key={event.auditId ?? `${event.stepName}-${idx}`}>
                  <td className="cf-mono">#{event.auditId ?? idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{event.stepName}</td>
                  <td>
                    <StatusBadge status={event.executionStatus} />
                  </td>
                  <td>{event.message || '—'}</td>
                  <td className="cf-mono" style={{ whiteSpace: 'nowrap' }}>
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
