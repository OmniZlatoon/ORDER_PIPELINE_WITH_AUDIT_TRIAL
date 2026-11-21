import { Navigate, Route, Routes } from 'react-router-dom';
import BookCataloguePage from '../pages/BookCataloguePage';
import CheckoutPage from '../pages/CheckoutPage';
import OrderLookupPage from '../pages/OrderLookupPage';
import OrderResultPage from '../pages/OrderResultPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<BookCataloguePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders/:orderId" element={<OrderResultPage />} />
      <Route path="/order-lookup" element={<OrderLookupPage />} />
      <Route path="/order-tracking" element={<OrderLookupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
