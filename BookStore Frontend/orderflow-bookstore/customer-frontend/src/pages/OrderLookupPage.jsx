import { useSearchParams } from 'react-router-dom';
import OrderTrackingDashboard from '../components/OrderTrackingDashboard';

export default function OrderLookupPage() {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  return (
    <div>
      <header className="cf-page-head">
        <div>
          <div className="cf-meta-line">
            <span>Order Tracking</span>
            <span aria-hidden="true">·</span>
            <span>Package Pipeline Dashboard</span>
          </div>
          <h1 className="cf-page-title">Order Tracking</h1>
          <p className="cf-page-subtitle">
            Enter your Order ID or Order Reference to view your package&apos;s current stage in the pipeline, shipping updates, and activity history.
          </p>
        </div>
      </header>

      <OrderTrackingDashboard initialOrderId={initialOrderId} />
    </div>
  );
}
