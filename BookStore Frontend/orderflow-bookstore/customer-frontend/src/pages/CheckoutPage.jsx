import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { extractApiError } from '../api/axiosClient';
import { createOrder } from '../api/orderApi';
import ErrorMessage from '../components/ErrorMessage';
import OrderForm from '../components/OrderForm';
import { useCart } from '../context/CartContext';
import { useBooks } from '../hooks/useBooks';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, estimatedTotal, addItem, updateQuantity, removeItem, clearCart } = useCart();
  const {
    books: availableBooks,
    loading: booksLoading,
    error: booksError,
    refetch: refetchBooks,
  } = useBooks();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [failedOrderId, setFailedOrderId] = useState(null);

  const handleOrderSubmit = async (customer) => {
    if (!items || items.length === 0) {
      setSubmitError('Please select at least one book before submitting your order.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setFailedOrderId(null);

    const payload = {
      customer: {
        fullName: customer.fullName,
        email: customer.email,
      },
      items: items.map((item) => ({
        bookId: item.bookId,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await createOrder(payload);
      clearCart();
      navigate(`/orders/${response.orderId}`, {
        state: {
          justSubmitted: true,
          initialOrder: response,
          customerEmail: customer.email,
        },
      });
    } catch (err) {
      const normalized = extractApiError(
        err,
        'Order submission failed. Please review your details and try again.'
      );
      setSubmitError(normalized.message);
      if (normalized.orderId) {
        setFailedOrderId(normalized.orderId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="cf-page-head">
        <div>
          <div className="cf-meta-line">
            <Link to="/" style={{ color: 'var(--cf-accent)', textDecoration: 'none', fontWeight: 600 }}>
              Catalogue
            </Link>
            <span aria-hidden="true">/</span>
            <span>Place Order</span>
          </div>
          <h1 className="cf-page-title">Place Order</h1>
          <p className="cf-page-subtitle">
            Enter your customer details, manage your selected books, and submit your order in one form.
          </p>
        </div>

        <Link to="/" className="cf-btn cf-btn-secondary">
          <ArrowLeft size={15} aria-hidden="true" />
          <span>Back to Catalogue</span>
        </Link>
      </header>

      {submitError ? (
        <ErrorMessage
          title="Order submission could not be completed"
          message={submitError}
          failedOrderId={failedOrderId}
        />
      ) : null}

      <div className="cf-single-order-form-wrap">
        <OrderForm
          fullName={fullName}
          email={email}
          onFullNameChange={setFullName}
          onEmailChange={setEmail}
          items={items}
          estimatedTotal={estimatedTotal}
          availableBooks={availableBooks}
          booksLoading={booksLoading}
          booksError={booksError}
          onRetryBooks={refetchBooks}
          onAddBook={addItem}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onSubmit={handleOrderSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
