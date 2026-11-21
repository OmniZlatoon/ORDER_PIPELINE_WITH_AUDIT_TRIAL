import { ArrowUpRight, Clock } from 'lucide-react';

function formatXaf(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'Amount unavailable';
  }
  return `XAF ${Number(amount).toLocaleString()}`;
}

export default function PaymentPanel({
  order,
  paymentLink,
  onProceedToPayment,
  reconciliationError,
  sessionWarning,
}) {
  if (!order || String(order.paymentStatus).toUpperCase() !== 'PENDING') {
    return null;
  }

  return (
    <section className="cf-card cf-payment-panel" aria-label="Complete payment">
      <div className="cf-payment-panel-heading">
        <div>
          <h2 className="cf-section-title">Payment required</h2>
          <p className="cf-section-desc">
            Your order passed validation, inventory, and pricing. Complete payment to continue the remaining order steps.
          </p>
        </div>
        <span className="cf-badge cf-badge-warning">
          <Clock size={13} aria-hidden="true" />
          <span>PENDING</span>
        </span>
      </div>

      <div className="cf-payment-amount">
        <span className="cf-stat-label">Amount due through Fapshi</span>
        <strong>{formatXaf(order.paymentAmountXaf)}</strong>
        {order.exchangeRateUsdXaf ? (
          <span className="cf-payment-rate">
            Rate: 1 USD = {Number(order.exchangeRateUsdXaf).toLocaleString()} XAF
          </span>
        ) : null}
      </div>

      <div className="cf-payment-methods" aria-label="Supported mobile money providers">
        <div className="cf-payment-method">
          <span className="cf-payment-brand cf-payment-brand-mtn">MTN</span>
          <span>MTN Mobile Money</span>
        </div>
        <div className="cf-payment-method">
          <span className="cf-payment-brand cf-payment-brand-orange">orange</span>
          <span>Orange Money</span>
        </div>
      </div>

      {paymentLink ? (
        <button type="button" className="cf-btn cf-btn-primary" onClick={onProceedToPayment}>
          <span>Proceed to Payment</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      ) : (
        <p className="cf-alert cf-alert-info" role="status">
          {order.paymentMessage || 'The payment session is not available yet. Do not place a duplicate order; refresh this page or look up the order again.'}
        </p>
      )}

      <p className="cf-payment-note">
        Payment status is confirmed by the backend using Fapshi notifications and status checks. Returning from the payment page alone does not mark an order paid.
      </p>
      {reconciliationError ? (
        <p className="cf-field-error" role="alert">{reconciliationError}</p>
      ) : null}
      {sessionWarning ? (
        <p className="cf-field-error" role="status">{sessionWarning}</p>
      ) : null}
    </section>
  );
}
