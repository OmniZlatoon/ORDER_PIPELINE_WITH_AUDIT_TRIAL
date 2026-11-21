import { AlertCircle, CheckCircle2, Clock, Loader2, MinusCircle } from 'lucide-react';

const STATUS_CONFIG = {
  COMPLETED: { className: 'cf-badge-success', Icon: CheckCircle2, label: 'COMPLETED' },
  SUCCESS: { className: 'cf-badge-success', Icon: CheckCircle2, label: 'SUCCESS' },
  SENT: { className: 'cf-badge-success', Icon: CheckCircle2, label: 'SENT' },
  STARTED: { className: 'cf-badge-started', Icon: Loader2, label: 'STARTED' },
  PROCESSING: { className: 'cf-badge-started', Icon: Loader2, label: 'PROCESSING' },
  CREATED: { className: 'cf-badge-warning', Icon: Clock, label: 'CREATED' },
  PENDING: { className: 'cf-badge-warning', Icon: Clock, label: 'PENDING' },
  FAILED: { className: 'cf-badge-failed', Icon: AlertCircle, label: 'FAILED' },
  NOT_EXECUTED: { className: 'cf-badge-neutral', Icon: MinusCircle, label: 'NOT EXECUTED' },
  'NOT EXECUTED': { className: 'cf-badge-neutral', Icon: MinusCircle, label: 'NOT EXECUTED' },
  NOT_PROCESSED: { className: 'cf-badge-neutral', Icon: MinusCircle, label: 'NOT_PROCESSED' },
};

export default function StatusBadge({ status, label }) {
  const normalized = String(status || 'PENDING').trim().toUpperCase();
  const config = STATUS_CONFIG[normalized] || {
    className: 'cf-badge-neutral',
    Icon: Clock,
    label: normalized,
  };
  const Icon = config.Icon;

  return (
    <span className={`cf-badge ${config.className}`}>
      <Icon size={13} aria-hidden="true" />
      <span>{label || config.label}</span>
    </span>
  );
}
