import React, { useState } from "react";
import type { Place } from "../types";
import { categoryIcon, categoryName } from "../types";
import { formatDuration } from "../lib/schedule";

export function PlaceThumb({ place }: { place: Place }) {
  // Ảnh lấy từ CDN của cổng: nếu tải lỗi thì hiện biểu tượng thay thế
  const [failed, setFailed] = useState(false);
  const src = place.images[0];
  return (
    <div className="thumb">
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} /> : categoryIcon(place.category)}
    </div>
  );
}

export function PlaceCard({ place, onClick, action }: { place: Place; onClick?: () => void; action?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  const src = place.images[0];
  return (
    <div className="place-big" onClick={onClick}>
      <div className="place-big-img">
        {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} /> : <span>{categoryIcon(place.category)}</span>}
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
