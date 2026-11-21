import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading bookstore information...' }) {
  return (
    <div className="cf-spinner-wrap" role="status" aria-live="polite">
      <Loader2 size={28} className="cf-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
