import { ShoppingBag } from 'lucide-react';
import { BrowserRouter, Link, NavLink } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import AppRoutes from './routes/AppRoutes';

function CustomerShellContent() {
  const { totalItemCount } = useCart();

  return (
    <div className="cf-root">
      <header className="cf-header">
        <div className="cf-container cf-header-inner">
          <Link to="/" className="cf-brand">
            OrderFlow Books
          </Link>

          <nav className="cf-nav" aria-label="Customer storefront navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `cf-nav-link ${isActive ? 'active' : ''}`}
            >
              Catalogue
            </NavLink>
            <NavLink
              to="/order-lookup"
              className={({ isActive }) => `cf-nav-link ${isActive ? 'active' : ''}`}
            >
              Order Lookup
            </NavLink>
            <NavLink
              to="/checkout"
              className={({ isActive }) => `cf-nav-link ${isActive ? 'active' : ''}`}
            >
              Checkout
            </NavLink>
          </nav>

          <Link to="/checkout" className="cf-header-cta">
            <ShoppingBag size={16} aria-hidden="true" />
            <span>Review Order ({totalItemCount})</span>
          </Link>
        </div>
      </header>

      <main className="cf-main">
        <div className="cf-container">
          <AppRoutes />
        </div>
      </main>

      <footer className="cf-footer">
        <div className="cf-container">
          <div className="cf-footer-grid">
            <div>
              <h2 className="cf-footer-brand">OrderFlow Books</h2>
              <p style={{ margin: 0, maxWidth: '40ch', lineHeight: 1.6 }}>
                Your online bookstore for discovering titles, placing orders, and following every step of order confirmation and delivery.
              </p>
            </div>
            <div>
              <h3 className="cf-footer-heading">Storefront</h3>
              <ul className="cf-footer-links">
                <li><Link to="/">Browse Catalogue</Link></li>
                <li><Link to="/checkout">Order Checkout</Link></li>
                <li><Link to="/order-lookup">Order Lookup</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="cf-footer-heading">Order Tracking</h3>
              <ul className="cf-footer-links">
                <li><Link to="/order-lookup">Track an Order</Link></li>
                <li><Link to="/checkout">Place New Order</Link></li>
                <li><Link to="/">Available Titles</Link></li>
              </ul>
            </div>
          </div>

          <div className="cf-footer-inner">
            <span>OrderFlow Books — Online Bookstore</span>
            <span>Powered by <strong style={{ color: '#ffffff', fontWeight: 600 }}>Webuild</strong></span>
            <span>Transparent Step-by-Step Order Tracking</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function CustomerShell() {
  return <CustomerShellContent />;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <CustomerShell />
      </CartProvider>
    </BrowserRouter>
  );
}
