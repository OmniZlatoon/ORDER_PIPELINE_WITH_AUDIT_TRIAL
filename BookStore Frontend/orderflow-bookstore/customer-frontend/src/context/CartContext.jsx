import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (book, quantityToAdd = 1) => {
    const maxStock = Number(book.stockQuantity ?? 0);
    if (maxStock <= 0) {
      return;
    }

    setItems((prev) => {
      const existing = prev.find((entry) => entry.bookId === book.bookId);
      if (existing) {
        const nextQty = Math.min(maxStock, existing.quantity + quantityToAdd);
        return prev.map((entry) =>
          entry.bookId === book.bookId
            ? {
                ...entry,
                title: book.title,
                author: book.author,
                unitPrice: Number(book.price),
                stockQuantity: maxStock,
                imageUrl: book.imageUrl || book.coverImage || entry.imageUrl || '',
                quantity: nextQty,
              }
            : entry
        );
      }

      return [
        ...prev,
        {
          bookId: book.bookId,
          title: book.title,
          author: book.author,
          unitPrice: Number(book.price),
          stockQuantity: maxStock,
          imageUrl: book.imageUrl || book.coverImage || '',
          quantity: Math.min(maxStock, Math.max(1, quantityToAdd)),
        },
      ];
    });
  };

  const updateQuantity = (bookId, nextQuantity) => {
    setItems((prev) =>
      prev
        .map((entry) => {
          if (entry.bookId !== bookId) {
            return entry;
          }
          const clamped = Math.max(0, Math.min(entry.stockQuantity, Number(nextQuantity) || 0));
          return { ...entry, quantity: clamped };
        })
        .filter((entry) => entry.quantity > 0)
    );
  };

  const removeItem = (bookId) => {
    setItems((prev) => prev.filter((entry) => entry.bookId !== bookId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo(() => {
    const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    // Frontend estimate only; authoritative total is always computed by Spring Boot from MySQL.
    const estimatedTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return {
      items,
      totalItemCount,
      estimatedTotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider.');
  }
  return ctx;
}
