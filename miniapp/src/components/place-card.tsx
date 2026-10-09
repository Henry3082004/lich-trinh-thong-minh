import React, { useState } from "react";
import type { Place } from "../types";
import { categoryIcon, categoryName } from "../types";
import { formatDuration } from "../lib/schedule";

// Ảnh địa điểm: thử lần lượt từng ảnh trong danh sách, ảnh nào lỗi thì chuyển ảnh kế; hết ảnh thì hiện phần thay thế
export function PlaceImg({ place, alt = "", fallback, lazy = true }: { place: Place; alt?: string; fallback: React.ReactNode; lazy?: boolean }) {
  const [idx, setIdx] = useState(0);
  const src = place.images[idx];
  if (!src) return <>{fallback}</>;
  return <img key={src} src={src} alt={alt} loading={lazy ? "lazy" : undefined} onError={() => setIdx((i) => i + 1)} />;
}

export function PlaceThumb({ place }: { place: Place }) {
  // Ảnh lấy từ CDN của cổng: nếu tải lỗi thì hiện biểu tượng thay thế
  return (
    <div className="thumb">
      <PlaceImg place={place} fallback={categoryIcon(place.category)} />
    </div>
  );
}

export function PlaceCard({ place, onClick, action }: { place: Place; onClick?: () => void; action?: React.ReactNode }) {
  return (
    <div className="place-big" onClick={onClick}>
      <div className="place-big-img">
        <PlaceImg place={place} fallback={<span>{categoryIcon(place.category)}</span>} />
      </div>
      <div className="place-big-body">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="place-big-cat">{categoryName(place.category)}</div>
          <div className="place-big-name">{place.name}</div>
          <div className="place-big-addr">{place.kind === "festival" && place.season ? `🗓 ${place.season}` : place.address || `~${formatDuration(place.durationMin)}`}</div>
        </div>
        {action}
      </div>
    </div>
  );
}
