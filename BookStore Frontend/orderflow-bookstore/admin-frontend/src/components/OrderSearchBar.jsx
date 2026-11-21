import { Search } from 'lucide-react';
import { useState } from 'react';

export default function OrderSearchBar({
  initialQuery = '',
  onSearch,
  loading = false,
  placeholder = 'Enter Order ID (e.g. 104) or Order Reference (e.g. ORD-2026-00104)...',
  buttonLabel = 'Inspect Order',
}) {
  const [query, setQuery] = useState(initialQuery);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setValidationError('Enter an Order ID or Order Reference to search.');
      return;
    }
    setValidationError('');
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="af-search-bar">
        <div className="af-search-input-wrap">
          <Search size={16} className="af-search-icon" style={{ left: 16 }} aria-hidden="true" />
          <input
            type="text"
            className="af-input af-input-with-icon"
            style={{ paddingLeft: 42 }}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (validationError) {
                setValidationError('');
              }
            }}
            aria-label="Order ID or Order Reference"
          />
        </div>
        <button type="submit" className="af-btn af-btn-primary" disabled={loading}>
          <Search size={15} aria-hidden="true" />
          <span>{loading ? 'Searching...' : buttonLabel}</span>
        </button>
      </div>
      {validationError ? (
        <p style={{ color: 'var(--af-error-text)', fontSize: '0.82rem', margin: '8px 0 0', fontWeight: 500 }}>
          {validationError}
        </p>
      ) : null}
    </form>
  );
}
