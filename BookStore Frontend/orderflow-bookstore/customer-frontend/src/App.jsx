import { ShoppingBag } from 'lucide-react';
import { BrowserRouter, Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import AppRoutes from './routes/AppRoutes';

function CustomerShellContent({ onAdminAccess }) {
  const navigate = useNavigate();
  const { totalItemCount } = useCart();
  const { currentUser, isAuthenticated, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

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
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="cf-nav-btn"
                title={`Signed in as ${currentUser?.fullName || currentUser?.email}`}
              >
                Sign Out
              </button>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) => `cf-nav-link ${isActive ? 'active' : ''}`}
              >
                Sign In
              </NavLink>
            )}
          </nav>

          <Link to="/checkout" className="cf-header-cta">
            <ShoppingBag size={16} aria-hidden="true" />
            <span>Review Order ({totalItemCount})</span>
          </Link>
        </div>
      </header>

      <main className="cf-main">
        <div className="cf-container">
          <AppRoutes onAdminAccess={onAdminAccess} />
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
              <h3 className="cf-footer-heading">Customer Account</h3>
              <ul className="cf-footer-links">
                {isAuthenticated ? (
                  <li><span>Signed in as {currentUser?.fullName || currentUser?.email}</span></li>
                ) : (
                  <>
                    <li><Link to="/login">Sign In</Link></li>
                    <li><Link to="/signup">Create Account</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="cf-footer-inner">
            <span>
              OrderFlow Books — Online Bookstore
              {isAuthenticated && currentUser?.fullName ? ` · Signed in as ${currentUser.fullName}` : ''}
            </span>
            <span>Transparent Step-by-Step Order Tracking</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function CustomerShell({ onAdminAccess }) {
  return (
    <AuthProvider>
      <CustomerShellContent onAdminAccess={onAdminAccess} />
    </AuthProvider>
  );
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
