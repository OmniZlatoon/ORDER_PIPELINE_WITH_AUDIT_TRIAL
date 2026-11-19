import { Info, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractApiError } from '../api/axiosClient';
import { fetchOrders, lookupOrder } from '../api/orderApi';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderSearchBar from '../components/OrderSearchBar';
import OrderTable from '../components/OrderTable';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listingMissing, setListingMissing] = useState(false);

  const [searchFilter, setSearchFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    setListingMissing(false);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      const normalized = extractApiError(err, 'Unable to load orders right now.');
      if (normalized.endpointUnavailable) {
        setListingMissing(true);
      } else {
        setError(normalized.message);
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleQuickLookup = async (query) => {
    setLookupLoading(true);
    setLookupError(null);
    try {
      const order = await lookupOrder(query);
      navigate(`/admin/orders/${order.orderId}`);
    } catch (err) {
      const normalized = extractApiError(err, `No order found matching "${query}".`);
      setLookupError(normalized.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !q
        || String(order.orderReference || '').toLowerCase().includes(q)
        || String(order.customerName || order.customer?.fullName || '').toLowerCase().includes(q)
        || String(order.orderId || '').includes(q);

      const matchesOrderStatus =
        orderStatusFilter === 'ALL'
        || String(order.orderStatus || '').toUpperCase() === orderStatusFilter;

      const matchesPaymentStatus =
        paymentStatusFilter === 'ALL'
        || String(order.paymentStatus || '').toUpperCase() === paymentStatusFilter;

      return matchesQuery && matchesOrderStatus && matchesPaymentStatus;
    });
  }, [orders, searchFilter, orderStatusFilter, paymentStatusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o) => String(o.orderStatus).toUpperCase() === 'COMPLETED').length;
    const failed = orders.filter((o) => String(o.orderStatus).toUpperCase() === 'FAILED').length;
    const active = total - completed - failed;
    return { total, completed, failed, active };
  }, [orders]);

  return (
    <div className="af-stack">
      <section className="af-wave-hero" aria-label="Administrator operations header">
        <div className="af-wave-hero-shape-1" aria-hidden="true" />
        <div className="af-wave-hero-shape-2" aria-hidden="true" />

        <div className="af-wave-hero-inner">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 className="af-page-title" style={{ color: '#ffffff' }}>
                Administrator Operations Dashboard
              </h1>
              <p className="af-page-subtitle" style={{ color: 'rgba(255, 255, 255, 0.82)' }}>
                Track bookstore orders, step-by-step progress, activity records, and customer notifications.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              className="af-btn af-btn-secondary"
              disabled={loading}
              style={{ border: 'none' }}
            >
              <RefreshCw size={15} className={loading ? 'af-spin' : ''} aria-hidden="true" />
              <span>Refresh Orders</span>
            </button>
          </div>

          <div style={{ maxWidth: 640 }}>
            <OrderSearchBar
              onSearch={handleQuickLookup}
              loading={lookupLoading}
              buttonLabel="View Order"
            />
            {lookupError ? (
              <div style={{ marginTop: 12 }}>
                <ErrorMessage title="Order lookup failed" message={lookupError} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="af-card">
          <LoadingSpinner message="Loading bookstore orders..." />
        </div>
      ) : listingMissing ? (
        <div className="af-alert af-alert-info" role="status">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Info size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                Full order list is currently unavailable
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                A complete list of all orders is not available here right now. Use the Order Lookup search above to view any order by Order ID or Order Reference.
              </p>
            </div>
          </div>
        </div>
      ) : error ? (
        <ErrorMessage
          title="Unable to retrieve orders overview"
          message={error}
          onRetry={loadOrders}
        />
      ) : (
        <>
          <div className="af-kpi-grid" aria-label="Order summary counts">
            <div className="af-kpi-card">
              <div className="af-kpi-label">Total Orders</div>
              <div className="af-kpi-value">{stats.total}</div>
            </div>
            <div className="af-kpi-card">
              <div className="af-kpi-label">Completed</div>
              <div className="af-kpi-value" style={{ color: 'var(--af-success-text)' }}>
                {stats.completed}
              </div>
            </div>
            <div className="af-kpi-card">
              <div className="af-kpi-label">Failed</div>
              <div className="af-kpi-value" style={{ color: 'var(--af-error-text)' }}>
                {stats.failed}
              </div>
            </div>
            <div className="af-kpi-card">
              <div className="af-kpi-label">Pending / Processing</div>
              <div className="af-kpi-value" style={{ color: 'var(--af-started-text)' }}>
                {stats.active}
              </div>
            </div>
          </div>

          <section className="af-card" aria-label="Orders overview table">
            <div className="af-filter-row">
              <div className="af-search-input-wrap">
                <Search size={16} className="af-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="af-input af-input-with-icon"
                  placeholder="Filter by order reference, customer name, or ID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  aria-label="Filter orders by reference or customer name"
                />
              </div>

              <select
                className="af-select"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                aria-label="Filter by order status"
              >
                <option value="ALL">All Order Statuses</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="PENDING">PENDING</option>
              </select>

              <select
                className="af-select"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                aria-label="Filter by payment status"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="NOT_PROCESSED">NOT_PROCESSED</option>
              </select>
            </div>

            <OrderTable orders={filteredOrders} />
          </section>
        </>
      )}
    </div>
  );
}
