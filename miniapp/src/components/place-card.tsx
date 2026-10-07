import React from "react";
import type { Place } from "../types";
import { categoryIcon, categoryName } from "../types";
import { formatDuration } from "../lib/schedule";

export function PlaceThumb({ place }: { place: Place }) {
  return <div className="thumb">{place.images[0] ? <img src={place.images[0]} alt="" /> : categoryIcon(place.category)}</div>;
}

export function PlaceCard({ place, onClick, action }: { place: Place; onClick?: () => void; action?: React.ReactNode }) {
  return (
    <div className="card place-card" onClick={onClick}>
      <PlaceThumb place={place} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{place.name}</div>
        <div className="row" style={{ gap: 6, marginBottom: 4 }}>
          <span className="badge">{categoryName(place.category)}</span>
          <span className="muted">~{formatDuration(place.durationMin)}</span>
        </div>
        <div className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {place.description}
        </div>
      </div>
      {action}
    </div>
  );
}
