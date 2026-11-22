export default function MobileMoneyMethods() {
  return (
    <div className="cf-payment-methods" aria-label="Supported mobile money providers">
      <div className="cf-payment-method">
        <span className="cf-payment-brand cf-payment-brand-mtn" aria-label="MTN">MTN</span>
        <span>MTN Mobile Money</span>
      </div>
      <div className="cf-payment-method">
        <span className="cf-payment-brand cf-payment-brand-orange" aria-label="Orange">orange</span>
        <span>Orange Money</span>
      </div>
    </div>
  );
}
