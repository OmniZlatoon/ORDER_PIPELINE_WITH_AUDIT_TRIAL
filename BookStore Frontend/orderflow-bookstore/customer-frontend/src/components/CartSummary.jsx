import { ArrowRight, ShoppingCart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuantitySelector from './QuantitySelector';

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CartSummary({
  items,
  estimatedTotal,
  onUpdateQuantity,
  onRemoveItem,
  showCheckoutButton = true,
  allowEdit = true,
}) {
  return (
    <aside className="cf-card cf-cart-panel" aria-label="Selected order items">
      <h2 className="cf-section-title">Selected Order Items</h2>
      <p className="cf-section-desc">
        Review your selected books and quantities before checking out.
      </p>

      {!items || items.length === 0 ? (
        <div className="cf-empty" style={{ padding: '28px 18px' }}>
          <ShoppingCart size={26} color="#71717a" aria-hidden="true" />
          <p className="cf-empty-title" style={{ fontSize: '1rem' }}>
            Your order selection is empty
          </p>
          <p className="cf-empty-text" style={{ marginBottom: 0 }}>
            Select books from the catalogue to begin an order.
          </p>
        </div>
      ) : (
        <>
          <ul className="cf-cart-list">
            {items.map((item) => {
              const lineTotal = item.unitPrice * item.quantity;
              return (
                <li key={item.bookId} className="cf-cart-item">
                  <div className="cf-cart-item-top">
                    <div>
                      <p className="cf-cart-item-title">{item.title}</p>
                      <span className="cf-cart-item-sub">
                        {item.quantity} × ${formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                    {allowEdit ? (
                      <button
                        type="button"
                        className="cf-btn cf-btn-ghost"
                        onClick={() => onRemoveItem(item.bookId)}
                        aria-label={`Remove ${item.title} from order`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>

                  <div className="cf-cart-item-bottom">
                    {allowEdit ? (
                      <QuantitySelector
                        value={item.quantity}
                        maxStock={item.stockQuantity}
                        onChange={(qty) => onUpdateQuantity(item.bookId, qty)}
                        itemLabel={item.title}
                      />
                    ) : (
                      <span className="cf-cart-item-sub">Qty: {item.quantity}</span>
                    )}
                    <span className="cf-cart-line-total">${formatCurrency(lineTotal)}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="cf-cart-total-row">
            <span className="cf-cart-total-label">Estimated Total</span>
            <span className="cf-cart-total-amount">${formatCurrency(estimatedTotal)}</span>
          </div>

          <div className="cf-authority-note">
            Estimated total only. The final confirmed price is calculated when your order is placed.
          </div>

          {showCheckoutButton ? (
            <Link to="/checkout" className="cf-btn cf-btn-primary cf-btn-full">
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </>
      )}
    </aside>
  );
}
