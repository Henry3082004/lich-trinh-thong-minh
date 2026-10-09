import React, { useEffect, useState } from "react";
import { useNavigate } from "zmp-ui";
import { useCart } from "../state/cart";

// Nút giỏ nổi "🧺 Lịch trình (N)": chỉ hiện khi giỏ có mục, nảy lên mỗi lần thêm
export function CartButton({ withBottom = false, inline = false }: { withBottom?: boolean; inline?: boolean }) {
  const navigate = useNavigate();
  const { count, bump } = useCart();
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (bump === 0) return;
    setPop(true);
    const t = setTimeout(() => setPop(false), 450);
    return () => clearTimeout(t);
  }, [bump]);

  // inline: nút nằm trong trang (trang chủ), luôn hiện để khách biết chỗ xem giỏ
  if (count === 0 && !inline) return null;
  return (
    <button data-tour="cart" className={`${inline ? "cart-inline" : `cart-fab ${withBottom ? "with-bottom" : ""}`} ${pop ? "pop" : ""}`} onClick={() => navigate("/cart")} aria-label={`Lịch trình, ${count} mục`}>
      <span aria-hidden>🧺</span> Lịch trình
      <b>{count}</b>
    </button>
  );
}
