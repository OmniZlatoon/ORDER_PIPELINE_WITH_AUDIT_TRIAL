import { Navigate, Route, Routes } from 'react-router-dom';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AuditHistoryPage from '../pages/AuditHistoryPage';
import BookInventoryPage from '../pages/BookInventoryPage';
import NotificationMonitorPage from '../pages/NotificationMonitorPage';
import OrderLookupPage from '../pages/OrderLookupPage';
import OrderProcessingMonitorPage from '../pages/OrderProcessingMonitorPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/books" element={<BookInventoryPage />} />
      <Route path="/admin/order-lookup" element={<OrderLookupPage />} />
      <Route path="/admin/orders/:orderId" element={<OrderProcessingMonitorPage />} />
      <Route path="/admin/orders/:orderId/audit" element={<AuditHistoryPage />} />
      <Route path="/admin/orders/:orderId/notifications" element={<NotificationMonitorPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
