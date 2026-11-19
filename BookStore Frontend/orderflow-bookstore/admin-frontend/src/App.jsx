import { Bell, BookOpen, FileText, GitCommitHorizontal, LayoutDashboard, LogOut, Search } from 'lucide-react';
import { BrowserRouter, Link, NavLink, useLocation } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';

function extractOrderIdFromPath(pathname) {
  const match = pathname.match(/^\/admin\/orders\/([^/]+)/);
  return match ? match[1] : null;
}

export function AdminShell({ onAdminLogout }) {
  const location = useLocation();
  const activeOrderId = extractOrderIdFromPath(location.pathname);

  return (
    <div className="af-root">
      <aside className="af-sidebar" aria-label="Administrator navigation">
        <Link to="/admin" className="af-sidebar-brand">
          OrderFlow Admin
        </Link>

        <div className="af-sidebar-group-label">Operations</div>
        <nav className="af-sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} aria-hidden="true" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/books"
            className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <BookOpen size={16} aria-hidden="true" />
            <span>Book Stock</span>
          </NavLink>
          <NavLink
            to="/admin/order-lookup"
            className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Search size={16} aria-hidden="true" />
            <span>Order Lookup</span>
          </NavLink>
        </nav>

        {activeOrderId ? (
          <>
            <div className="af-sidebar-group-label" style={{ marginTop: 22 }}>
              Order #{activeOrderId}
            </div>
            <nav className="af-sidebar-nav">
              <NavLink
                to={`/admin/orders/${activeOrderId}`}
                end
                className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <GitCommitHorizontal size={16} aria-hidden="true" />
                <span>Order Progress</span>
              </NavLink>
              <NavLink
                to={`/admin/orders/${activeOrderId}/audit`}
                className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <FileText size={16} aria-hidden="true" />
                <span>Activity History</span>
              </NavLink>
              <NavLink
                to={`/admin/orders/${activeOrderId}/notifications`}
                className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Bell size={16} aria-hidden="true" />
                <span>Notifications</span>
              </NavLink>
            </nav>
          </>
        ) : null}

        <div className="af-sidebar-footer">
          View-only order tracking, activity history, and stock management console.
        </div>
      </aside>

      <div className="af-shell-main">
        <nav className="af-mobile-nav" aria-label="Mobile administrator navigation">
          <NavLink to="/admin" end className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/books" className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}>
            Book Stock
          </NavLink>
          <NavLink to="/admin/order-lookup" className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}>
            Order Lookup
          </NavLink>
          {activeOrderId ? (
            <>
              <NavLink to={`/admin/orders/${activeOrderId}`} end className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}>
                Details #{activeOrderId}
              </NavLink>
              <NavLink to={`/admin/orders/${activeOrderId}/audit`} className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}>
                Activity
              </NavLink>
              <NavLink to={`/admin/orders/${activeOrderId}/notifications`} className={({ isActive }) => `af-sidebar-link ${isActive ? 'active' : ''}`}>
                Notifications
              </NavLink>
            </>
          ) : null}
        </nav>

        <header className="af-topbar">
          <div className="af-breadcrumb">
            <Link to="/admin">Admin Console</Link>
            <span aria-hidden="true">/</span>
            <span className="af-breadcrumb-current">
              {activeOrderId
                ? location.pathname.endsWith('/audit')
                  ? `Order #${activeOrderId} Activity History`
                  : location.pathname.endsWith('/notifications')
                    ? `Order #${activeOrderId} Notifications`
                    : `Order #${activeOrderId} Details`
                : location.pathname === '/admin/books'
                  ? 'Book Stock Management'
                  : location.pathname === '/admin/order-lookup'
                    ? 'Order Lookup'
                    : 'Dashboard'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/admin/books" className="af-btn af-btn-secondary">
              <BookOpen size={14} aria-hidden="true" />
              <span>Manage Stock</span>
            </Link>
            <Link to="/admin/order-lookup" className="af-btn af-btn-secondary">
              <Search size={14} aria-hidden="true" />
              <span>Find Order</span>
            </Link>
            {typeof onAdminLogout === 'function' ? (
              <button type="button" onClick={onAdminLogout} className="af-btn af-btn-secondary">
                <LogOut size={14} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            ) : null}
          </div>
        </header>

        <main className="af-content">
          <AdminRoutes />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminShell />
    </BrowserRouter>
  );
}
