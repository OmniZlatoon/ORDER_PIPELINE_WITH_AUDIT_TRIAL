import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading bookstore records...' }) {
  return (
    <div className="af-spinner-wrap" role="status" aria-live="polite">
      <Loader2 size={26} className="af-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
