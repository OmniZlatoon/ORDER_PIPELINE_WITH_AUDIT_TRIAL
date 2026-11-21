import { AlertCircle, CheckCircle2, Clock, Loader2, Mail, MinusCircle, Truck } from 'lucide-react';

const STATUS_MAP = {
  COMPLETED: { className: 'af-badge-success', Icon: CheckCircle2, label: 'COMPLETED' },
  SUCCESS: { className: 'af-badge-success', Icon: CheckCircle2, label: 'SUCCESS' },
  SENT: { className: 'af-badge-success', Icon: CheckCircle2, label: 'SENT' },
  STARTED: { className: 'af-badge-started', Icon: Loader2, label: 'STARTED' },
  PROCESSING: { className: 'af-badge-started', Icon: Loader2, label: 'PROCESSING' },
  CREATED: { className: 'af-badge-warning', Icon: Clock, label: 'CREATED' },
  PENDING: { className: 'af-badge-warning', Icon: Clock, label: 'PENDING' },
  FAILED: { className: 'af-badge-failed', Icon: AlertCircle, label: 'FAILED' },
  NOT_EXECUTED: { className: 'af-badge-neutral', Icon: MinusCircle, label: 'NOT EXECUTED' },
  'NOT EXECUTED': { className: 'af-badge-neutral', Icon: MinusCircle, label: 'NOT EXECUTED' },
  NOT_PROCESSED: { className: 'af-badge-neutral', Icon: MinusCircle, label: 'NOT_PROCESSED' },
  SHIPPING: { className: 'af-badge-started', Icon: Truck, label: 'SHIPPING' },
  EMAIL: { className: 'af-badge-neutral', Icon: Mail, label: 'EMAIL' },
};

export default function StatusBadge({ status, label }) {
  const normalized = String(status || 'PENDING').trim().toUpperCase();
  const config = STATUS_MAP[normalized] || {
    className: 'af-badge-neutral',
    Icon: Clock,
    label: normalized,
  };
  const Icon = config.Icon;

  return (
    <span className={`af-badge ${config.className}`}>
      <Icon size={13} aria-hidden="true" />
      <span>{label || config.label}</span>
    </span>
  );
}
