import { haversineKm } from "./suggest";

// Ước tính thời gian di chuyển giữa hai điểm theo phương tiện (đường chim bay × hệ số, tốc độ trung bình).
// Là điểm duy nhất cần thay khi có dữ liệu đường đi thật (Google Routes / OpenRouteService).
export type Transport = "o-to" | "xe-may" | "xe-khach";

export const TRANSPORT_LABEL: Record<Transport, string> = { "o-to": "ô tô", "xe-may": "xe máy", "xe-khach": "xe khách" };

// Đường núi quanh co: km đường thực tế dài hơn đường chim bay
const ROAD_FACTOR = 1.3;
const SPEED_KMH: Record<Transport, number> = { "o-to": 40, "xe-may": 35, "xe-khach": 30 };
// Xe khách không đến tận điểm: cộng thời gian chờ/đón xe cho mỗi chặng
const BUS_WAIT_MIN = 15;

export function travelMinutes(a: { lat: number; lng: number }, b: { lat: number; lng: number }, transport: Transport): number {
  const km = haversineKm(a, b) * ROAD_FACTOR;
  const minutes = (km / SPEED_KMH[transport]) * 60 + (transport === "xe-khach" && km > 0.5 ? BUS_WAIT_MIN : 0);
  return Math.max(0, Math.round(minutes / 5) * 5); // làm tròn 5 phút cho dễ đọc
}
