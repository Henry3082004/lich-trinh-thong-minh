import React, { useEffect, useState } from "react";
import { useNavigate } from "zmp-ui";
import { useCart } from "../state/cart";

// Nút giỏ nổi "🧺 Lịch trình (N)": chỉ hiện khi giỏ có mục, nảy lên mỗi lần thêm
export function CartButton({ withBottom = false }: { withBottom?: boolean }) {
  const navigate = useNavigate();
  const { count, bump } = useCart();
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (bump === 0) return;
    setPop(true);
    const t = setTimeout(() => setPop(false), 450);
    return () => clearTimeout(t);
  }, [bump]);

  if (count === 0) return null;
  return (
    <button className={`cart-fab ${withBottom ? "with-bottom" : ""} ${pop ? "pop" : ""}`} onClick={() => navigate("/cart")} aria-label={`Lịch trình, ${count} mục`}>
      <span aria-hidden>🧺</span> Lịch trình
      <b>{count}</b>
    </button>
  );
}
