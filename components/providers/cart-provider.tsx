"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CART_STORAGE_KEY, TABLE_STORAGE_KEY } from "@/lib/constants";
import type { CartItem, MenuItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  tableNumber: string;
};

type CartContextValue = CartState & {
  hydrated: boolean;
  itemCount: number;
  totalAmount: number;
  addItem: (item: MenuItem, quantity?: number) => void;
  increaseItem: (itemId: string) => void;
  decreaseItem: (itemId: string) => void;
  clearCart: () => void;
  removeItem: (itemId: string) => void;
  setActiveTable: (tableNumber: string) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function safeGetStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable (iOS private mode, storage full, etc.)
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ items: [], tableNumber: "" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const rawItems = safeGetStorage(CART_STORAGE_KEY);
    const rawTable = safeGetStorage(TABLE_STORAGE_KEY);

    // Intentional: localStorage is only available client-side, so the cart
    // hydrates from storage here. Lazy initial state is not viable because
    // the provider must render the same tree on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      items: rawItems ? (() => { try { return JSON.parse(rawItems) as CartItem[]; } catch { return []; } })() : [],
      tableNumber: rawTable ?? "",
    });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    safeSetStorage(CART_STORAGE_KEY, JSON.stringify(state.items));
    safeSetStorage(TABLE_STORAGE_KEY, state.tableNumber);
  }, [hydrated, state.items, state.tableNumber]);

  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
  const totalAmount = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const addItem = useCallback((item: MenuItem, qty = 1) => {
    setState((current) => {
      const existing = current.items.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return {
          ...current,
          items: current.items.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + qty }
              : cartItem,
          ),
        };
      }

      return {
        ...current,
        items: [...current.items, { ...item, quantity: qty }],
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setState((current) => ({ ...current, items: [] }));
  }, []);

  const decreaseItem = useCallback((itemId: string) => {
    setState((current) => ({
      ...current,
      items: current.items
        .map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    }));
  }, []);

  const increaseItem = useCallback((itemId: string) => {
    setState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setState((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  }, []);

  const setActiveTable = useCallback((tableNumber: string) => {
    setState((current) => {
      if (!tableNumber) {
        if (!current.tableNumber) {
          return current;
        }

        return { ...current, tableNumber: "" };
      }

      if (current.tableNumber === tableNumber) {
        return current;
      }

      return {
        items:
          current.tableNumber && current.tableNumber !== tableNumber
            ? []
            : current.items,
        tableNumber,
      };
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      ...state,
      addItem,
      clearCart,
      decreaseItem,
      hydrated,
      increaseItem,
      itemCount,
      removeItem,
      setActiveTable,
      totalAmount,
    }),
    [
      addItem,
      clearCart,
      decreaseItem,
      hydrated,
      increaseItem,
      itemCount,
      removeItem,
      setActiveTable,
      state,
      totalAmount,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
