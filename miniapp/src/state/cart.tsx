import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSnackbar } from "zmp-ui";
import { api } from "../lib/api";
import type { Place } from "../types";

// Giỏ lịch trình: cập nhật ngay trên màn hình (lạc quan), lỗi thì hoàn lại và báo
type CartApi = {
  items: Place[];
  count: number;
  has: (id: string) => boolean;
  toggle: (place: Place) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  // tăng mỗi lần thêm, để nút giỏ nảy lên
  bump: number;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { openSnackbar } = useSnackbar();
  const [items, setItems] = useState<Place[]>([]);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    api.cart().then(setItems).catch(() => {}); // chưa đăng nhập được thì giỏ trống, không báo lỗi ở màn đầu
  }, []);

  const fail = (e: unknown) => openSnackbar({ text: (e as Error).message || "Không cập nhật được giỏ", type: "error" });

  const toggle = useCallback(
    async (place: Place) => {
      const before = items;
      const present = before.some((p) => p.id === place.id);
      setItems(present ? before.filter((p) => p.id !== place.id) : [...before, place]);
      if (!present) setBump((n) => n + 1);
      try {
        setItems(present ? await api.removeFromCart(place.id) : await api.addToCart(place.id));
      } catch (e) {
        setItems(before);
        fail(e);
      }
    },
    [items],
  );

  const remove = useCallback(
    async (id: string) => {
      const before = items;
      setItems(before.filter((p) => p.id !== id));
      try {
        setItems(await api.removeFromCart(id));
      } catch (e) {
        setItems(before);
        fail(e);
      }
    },
    [items],
  );

  const clear = useCallback(async () => {
    const before = items;
    setItems([]);
    try {
      await api.clearCart();
    } catch (e) {
      setItems(before);
      fail(e);
    }
  }, [items]);

  const value = useMemo<CartApi>(
    () => ({ items, count: items.length, has: (id) => items.some((p) => p.id === id), toggle, remove, clear, bump }),
    [items, toggle, remove, clear, bump],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải nằm trong CartProvider");
  return ctx;
}
