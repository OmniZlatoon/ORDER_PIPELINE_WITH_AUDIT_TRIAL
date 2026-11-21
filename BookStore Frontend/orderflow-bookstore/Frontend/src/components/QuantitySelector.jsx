import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({
  value,
  maxStock,
  min = 1,
  disabled = false,
  onChange,
  itemLabel = 'book',
}) {
  const safeMax = Math.max(0, Number(maxStock) || 0);
  const current = Math.max(min, Math.min(safeMax || min, Number(value) || min));

  const handleDecrease = () => {
    if (current > min) {
      onChange(current - 1);
    }
  };

  const handleIncrease = () => {
    if (current < safeMax) {
      onChange(current + 1);
    }
  };

  return (
    <div className="cf-qty" role="group" aria-label={`Quantity for ${itemLabel}`}>
      <button
        type="button"
        className="cf-qty-btn"
        onClick={handleDecrease}
        disabled={disabled || current <= min}
        aria-label={`Decrease quantity for ${itemLabel}`}
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <span className="cf-qty-value" aria-live="polite">
        {current}
      </span>
      <button
        type="button"
        className="cf-qty-btn"
        onClick={handleIncrease}
        disabled={disabled || current >= safeMax}
        aria-label={`Increase quantity for ${itemLabel}`}
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
