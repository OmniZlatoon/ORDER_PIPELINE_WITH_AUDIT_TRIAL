import { AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ErrorMessage({
  title = 'Unable to load data',
  message,
  onRetry,
  failedOrderId,
}) {
  if (!message) {
    return null;
  }

  return (
    <div className="cf-alert cf-alert-error" role="alert">
      <div className="cf-alert-content">
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <div>
          <p className="cf-alert-title">{title}</p>
          <p className="cf-alert-text">{message}</p>
          {failedOrderId ? (
            <div style={{ marginTop: 12 }}>
              <Link to={`/orders/${failedOrderId}`} className="cf-btn cf-btn-secondary">
                View Order #{failedOrderId} Details
              </Link>
            </div>
          ) : null}
        </div>
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="cf-btn cf-btn-secondary">
          <RefreshCw size={15} aria-hidden="true" />
          <span>Retry</span>
        </button>
      ) : null}
    </div>
  );
}
