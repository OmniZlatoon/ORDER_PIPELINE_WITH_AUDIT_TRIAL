import { BrowserRouter } from 'react-router-dom';
import { CustomerShell } from '../orderflow-bookstore/customer-frontend/src/App.jsx';
import { CartProvider } from '../orderflow-bookstore/customer-frontend/src/context/CartContext.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <CustomerShell />
      </CartProvider>
    </BrowserRouter>
  );
}
