import type { Place } from "../types";

// Bộ sưu tập mở từ banner trang chủ: /places?collection=<id>
export type Collection = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  match: (p: Place) => boolean;
  sort?: (a: Place, b: Place) => number;
};

// Số tháng từ tháng hiện tại tới lần diễn ra gần nhất (0 = đang diễn ra)
export function monthsUntil(p: Place, now = new Date()): number {
  const m = now.getMonth() + 1;
  if (!p.months.length) return 99;
  return Math.min(...p.months.map((x) => (x - m + 12) % 12));
}

const hasTag = (p: Place, t: string) => p.tags.includes(t);
const viewFirst = (p: Place) => (hasTag(p, "check-in") || hasTag(p, "view-dep") || hasTag(p, "song-ao") ? 0 : 1);

export const COLLECTIONS: Collection[] = [
  {
    id: "le-hoi-sap-toi",
    icon: "🎊",
    title: "Lễ hội sắp diễn ra",
    desc: "Các lễ hội, mùa đẹp đang và sắp diễn ra trong 3 tháng tới.",
    match: (p) => (p.kind === "festival" || p.category === "le-hoi") && (p.months.length === 0 || monthsUntil(p) <= 3),
    sort: (a, b) => monthsUntil(a) - monthsUntil(b),
  },
  {
    id: "check-in",
    icon: "📸",
    title: "Điểm check-in nổi tiếng",
    desc: "Những góc chụp ảnh đẹp nhất Đắk Song.",
    match: (p) => hasTag(p, "check-in") && p.kind !== "festival",
  },
  {
    id: "trekking",
    icon: "🥾",
    title: "Trekking & cắm trại",
    desc: "Cung đường rừng, thác và bãi cắm trại.",
    match: (p) => hasTag(p, "trekking"),
  },
  {
    id: "mon-ngon",
    icon: "🍲",
    title: "Món ngon Đắk Song",
    desc: "Đặc sản nên thử và quán ăn ngon.",
    match: (p) => p.kind === "dish" || p.category === "dac-san" || p.category === "am-thuc",
    sort: (a, b) => (a.kind === "dish" ? 0 : 1) - (b.kind === "dish" ? 0 : 1),
  },
  {
    id: "ca-phe-view",
    icon: "☕",
    title: "Cà phê view đẹp",
    desc: "Quán cà phê vườn, view đồi, sống ảo.",
    match: (p) => p.category === "ca-phe",
    sort: (a, b) => viewFirst(a) - viewFirst(b),
  },
];

export const findCollection = (id: string | null) => COLLECTIONS.find((c) => c.id === id);
