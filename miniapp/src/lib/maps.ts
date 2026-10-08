// Link Google Maps tạo từ toạ độ (không cần khoá API). Điểm xuất phát để trống nên
// Google Maps tự lấy vị trí hiện tại của người dùng.
// Tài liệu: https://developers.google.com/maps/documentation/urls/get-started (Directions)
import type { Place } from "../types";

// Google Maps giới hạn số điểm dừng chen giữa (waypoints) trong một link
export const MAX_WAYPOINTS = 9;

const coord = (p: Pick<Place, "lat" | "lng">) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

const base = "https://www.google.com/maps/dir/?api=1&travelmode=driving";

export function directionsUrl(place: Pick<Place, "lat" | "lng">): string {
  return `${base}&destination=${coord(place)}`;
}

// Lộ trình đi qua các điểm theo thứ tự: điểm cuối là đích, các điểm trước là điểm dừng
export function dayRouteUrl(places: Pick<Place, "lat" | "lng">[]): string | null {
  if (places.length === 0) return null;
  const destination = places[places.length - 1];
  const waypoints = places.slice(0, -1).slice(0, MAX_WAYPOINTS);
  const wp = waypoints.length ? `&waypoints=${encodeURIComponent(waypoints.map(coord).join("|"))}` : "";
  return `${base}&destination=${coord(destination)}${wp}`;
}
