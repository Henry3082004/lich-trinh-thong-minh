import React, { useState } from "react";
import type { Place } from "../types";
import { categoryName } from "../types";
import { IconCalendarEvent, IconCheck, IconClock, IconMapPin } from "@tabler/icons-react";
import { CatIcon, ImgFallback } from "./icons";
import { formatDuration } from "../lib/schedule";
import { monthsUntil } from "../lib/collections";

// Lễ hội: "Đang diễn ra" / "Còn N tháng" để khách biết dịp nào sắp tới
const festivalBadge = (p: Place) => {
  if (!p.months.length) return "";
  const m = monthsUntil(p);
  return m === 0 ? "Đang diễn ra · " : `Còn ${m} tháng · `;
};

// Ảnh địa điểm: thử lần lượt từng ảnh trong danh sách, ảnh nào lỗi thì chuyển ảnh kế; hết ảnh thì hiện phần thay thế
export function PlaceImg({ place, alt = "", fallback, lazy = true }: { place: Place; alt?: string; fallback: React.ReactNode; lazy?: boolean }) {
  const [idx, setIdx] = useState(0);
  const src = place.images[idx];
  if (!src) return <>{fallback}</>;
  return <img key={src} src={src} alt={alt} loading={lazy ? "lazy" : undefined} onError={() => setIdx((i) => i + 1)} />;
}

export function PlaceThumb({ place }: { place: Place }) {
  // Ảnh lấy từ CDN của cổng: nếu tải lỗi thì hiện ô thay thế có icon nhóm
  return (
    <div className="thumb">
      <PlaceImg place={place} fallback={<ImgFallback category={place.category} />} />
    </div>
  );
}

// corner: nút đặt ở góc phải trên ảnh (vd nút thêm vào lịch trình ở trang Điểm đến)
export function PlaceCard({ place, onClick, action, corner, added = false }: { place: Place; onClick?: () => void; action?: React.ReactNode; corner?: React.ReactNode; added?: boolean }) {
  const festival = place.kind === "festival" && !!place.season;
  return (
    <div className="p-card" data-tour="place-card" onClick={onClick}>
      <div className="p-card-img">
        <PlaceImg place={place} fallback={<ImgFallback category={place.category} size={36} />} />
        {added && (
          <span className="p-added">
            <IconCheck size={16} stroke={2.5} aria-hidden />
            Đã thêm
          </span>
        )}
        {corner && <div className="p-card-corner">{corner}</div>}
      </div>
      <div className="p-card-body">
        <div className="p-card-info">
          <span className="p-tag">
            <CatIcon category={place.category} size={15} />
            {categoryName(place.category)}
          </span>
          <b className="p-card-name">{place.name}</b>
          <div className="p-meta">
            {festival ? (
              <span>
                <IconCalendarEvent size={15} stroke={2} aria-hidden />
                {festivalBadge(place)}
                {place.season}
              </span>
            ) : (
              <>
                {place.address && (
                  <span className="one-line">
                    <IconMapPin size={15} stroke={2} aria-hidden />
                    {place.address}
                  </span>
                )}
                <span>
                  <IconClock size={15} stroke={2} aria-hidden />
                  Tham quan khoảng {formatDuration(place.durationMin)}
                </span>
              </>
            )}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}
