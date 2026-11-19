import { Navigate, Route, Routes } from 'react-router-dom';
import BookCataloguePage from '../pages/BookCataloguePage';
import CheckoutPage from '../pages/CheckoutPage';
import LoginPage from '../pages/LoginPage';
import OrderLookupPage from '../pages/OrderLookupPage';
import OrderResultPage from '../pages/OrderResultPage';
import SignupPage from '../pages/SignupPage';

export default function AppRoutes({ onAdminAccess }) {
  return (
    <Routes>
      <Route path="/" element={<BookCataloguePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders/:orderId" element={<OrderResultPage />} />
      <Route path="/order-lookup" element={<OrderLookupPage />} />
      <Route path="/login" element={<LoginPage onAdminAccess={onAdminAccess} />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
