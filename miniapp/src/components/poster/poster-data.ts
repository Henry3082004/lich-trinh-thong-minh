import { formatDuration, travelMinutes } from "../../lib/schedule";
import type { Draft } from "../../types";
import { categoryName } from "../../types";

export type TemplateId = "forest" | "sunset" | "minimal";

export type PosterStop = {
  time: string;
  name: string;
  category: string;
  categoryLabel: string;
  photo: string | null; // data URL, null nếu không có hoặc tải lỗi
  travelMin: number; // thời gian di chuyển từ điểm trước (0 với điểm đầu ngày)
  duration: string; // vd "1 giờ 30 phút"
};

export type PosterDay = { day: number; stops: PosterStop[]; totalLabel: string };

export type PosterData = {
  title: string;
  days: PosterDay[];
  totalStops: number;
  heroPhoto: string | null;
  heroName: string;
  // Lịch dài thì thu gọn (bỏ ảnh nhỏ) để poster không dài quá
  compact: boolean;
};

export const POSTER_WIDTH = 1080;
export const POSTER_MIN_HEIGHT = 1350; // khổ 4:5
export const COMPACT_THRESHOLD = 8;

// Địa chỉ website hiển thị ở chân poster, đổi được bằng VITE_PORTAL_URL
export const posterFooterUrl = () => {
  const url = (import.meta.env.VITE_PORTAL_URL as string | undefined) || "https://dulichdaksong.vnasw.vn";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
};

export function photoUrlsOf(draft: Draft): string[] {
  return draft.schedule.flatMap((d) => d.stops.map((s) => s.place.images[0])).filter(Boolean);
}

// Địa chỉ ảnh dùng làm ảnh bìa: ưu tiên điểm tham quan (không phải quán ăn) đầu tiên có ảnh
export function pickHeroUrl(draft: Draft): string | null {
  const stops = draft.schedule.flatMap((d) => d.stops);
  const withPhoto = stops.filter((s) => s.place.images[0]);
  return (withPhoto.find((s) => s.place.category !== "am-thuc") ?? withPhoto[0])?.place.images[0] ?? null;
}

export function buildPosterData(draft: Draft, photos: Map<string, string | null>, heroPhoto: string | null): PosterData {
  const photoOf = (url?: string) => (url ? photos.get(url) ?? null : null);

  const days: PosterDay[] = draft.schedule.map((d) => {
    const stops = d.stops.map((s, i) => ({
      time: s.startTime ?? "",
      name: s.place.name,
      category: s.place.category,
      categoryLabel: categoryName(s.place.category),
      photo: photoOf(s.place.images[0]),
      travelMin: i > 0 ? travelMinutes(d.stops[i - 1].place, s.place) : 0,
      duration: formatDuration(s.place.durationMin),
    }));
    const minutes = d.stops.reduce((n, s, i) => n + s.place.durationMin + (i > 0 ? travelMinutes(d.stops[i - 1].place, s.place) : 0), 0);
    return { day: d.day, stops, totalLabel: minutes > 0 ? `~${formatDuration(Math.round(minutes / 30) * 30 || 30)}` : "" };
  });

  const totalStops = days.reduce((n, d) => n + d.stops.length, 0);
  return {
    title: draft.title,
    days,
    totalStops,
    heroPhoto,
    heroName: "",
    compact: totalStops > COMPACT_THRESHOLD,
  };
}
