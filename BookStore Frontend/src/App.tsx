import { useCallback, useState } from 'react';
import { BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AdminShell } from '../orderflow-bookstore/admin-frontend/src/App.jsx';
import { CustomerShell } from '../orderflow-bookstore/Frontend/src/App.jsx';
import { CartProvider } from '../orderflow-bookstore/Frontend/src/context/CartContext.jsx';

const ADMIN_SESSION_KEY = 'orderflow_admin_unlocked';

function readAdminSession() {
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function SeparatedFrontendHost() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [adminUnlocked, setAdminUnlocked] = useState(() => readAdminSession());

  const handleAdminUnlock = useCallback(() => {
    try {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } catch {
      // Ignore storage errors.
    }
    setAdminUnlocked(true);
    navigate('/admin', { replace: true });
  }, [navigate]);

  const handleAdminLogout = useCallback(() => {
    try {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore storage errors.
    }
    setAdminUnlocked(false);
    navigate('/', { replace: true });
  }, [navigate]);

  if (isAdminRoute) {
    if (!adminUnlocked) {
      return <Navigate to="/login" replace />;
    }
    return <AdminShell onAdminLogout={handleAdminLogout} />;
  }

  return (
    <CartProvider>
      <CustomerShell onAdminAccess={handleAdminUnlock} />
    </CartProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SeparatedFrontendHost />
    </BrowserRouter>
  );
}
