import React from "react";
import { IconCheck, IconPlus } from "@tabler/icons-react";
import { useCart } from "../state/cart";
import type { Place } from "../types";

// Nút "+ Thêm" / "✓ Đã thêm" vào giỏ lịch trình
export function AddButton({ place, size = "sm", label = false }: { place: Place; size?: "sm" | "lg"; label?: boolean }) {
  const { has, toggle } = useCart();
  const on = has(place.id);
  return (
    <button
      className={`add-btn ${size} ${on ? "on" : ""}`}
      aria-pressed={on}
      aria-label={on ? `Bỏ ${place.name} khỏi lịch trình` : `Thêm ${place.name} vào lịch trình`}
      onClick={(e) => {
        e.stopPropagation();
        toggle(place);
      }}
    >
      {on ? <IconCheck size={20} stroke={2.5} aria-hidden /> : <IconPlus size={20} stroke={2.5} aria-hidden />}
      {(label || size === "lg") && <span>{on ? "Đã thêm vào lịch trình" : "Thêm vào lịch trình"}</span>}
    </button>
  );
}
