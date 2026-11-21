import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({
  title = 'Unable to load records',
  message,
  onRetry,
}) {
  if (!message) {
    return null;
  }

  return (
    <div className="af-alert af-alert-error" role="alert">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <AlertCircle size={19} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.925rem', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: '0.875rem' }}>{message}</div>
        </div>
      </div>

      {onRetry ? (
        <button type="button" onClick={onRetry} className="af-btn af-btn-secondary">
          <RefreshCw size={15} aria-hidden="true" />
          <span>Retry</span>
        </button>
      ) : null}
    </div>
  );
}
