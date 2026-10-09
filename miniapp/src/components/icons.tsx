import React from "react";
import {
  IconBed,
  IconBuildingMonument,
  IconCoffee,
  IconConfetti,
  IconLayoutGrid,
  IconMapPin,
  IconMountain,
  IconSoup,
  IconTent,
  IconToolsKitchen2,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

// Bộ icon Tabler (nét 2px) thay cho emoji. Icon của từng nhóm địa điểm dùng chung ở mọi màn.
export const CATEGORY_ICONS: Record<string, TablerIcon> = {
  "": IconLayoutGrid,
  "thien-nhien": IconMountain,
  "van-hoa": IconBuildingMonument,
  "am-thuc": IconToolsKitchen2,
  "trai-nghiem": IconTent,
  "ca-phe": IconCoffee,
  "dac-san": IconSoup,
  "le-hoi": IconConfetti,
  "luu-tru": IconBed,
};

export function CatIcon({ category, size = 20, className }: { category: string; size?: number; className?: string }) {
  const I = CATEGORY_ICONS[category] ?? IconMapPin;
  return <I size={size} stroke={2} className={className} aria-hidden />;
}

// Ô thay ảnh khi địa điểm chưa có ảnh: nền kẻ sọc nhẹ + icon nhóm
export function ImgFallback({ category, size = 28 }: { category: string; size?: number }) {
  return (
    <span className="img-fallback">
      <CatIcon category={category} size={size} />
    </span>
  );
}
