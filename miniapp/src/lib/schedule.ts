import type { DraftDay, DraftStop, Meal, Place } from "../types";

const AVG_SPEED_KMH = 30;
const DAY_START_MIN = 8 * 60;

function haversineKm(a: Place, b: Place) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Điểm chưa có vị trí chính xác thì dùng thời gian ước lượng chung (cùng quy tắc với backend)
const APPROX_TRAVEL_MIN = 15;
export const travelMinutes = (a: Place, b: Place) =>
  a.approxLocation || b.approxLocation ? APPROX_TRAVEL_MIN : Math.round((haversineKm(a, b) / AVG_SPEED_KMH) * 60);

export const formatTime = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// Bữa ăn: lấy từ trường meal, lịch đã lưu (không có meal) thì nhận theo ghi chú "Ăn sáng/trưa/tối"
export const mealOf = (s: DraftStop): Meal | undefined =>
  s.meal ?? (/^Ăn sáng/i.test(s.note ?? "") ? "sang" : /^Ăn trưa/i.test(s.note ?? "") ? "trua" : /^Ăn tối/i.test(s.note ?? "") ? "toi" : undefined);
// Giờ sớm nhất của bữa trưa / tối (đến sớm thì chờ), cùng quy tắc với backend
const MEAL_NOT_BEFORE: Record<Meal, number> = { sang: 0, trua: 11 * 60, toi: 17 * 60 + 30 };
const BREAKFAST_START_MIN = 7 * 60;

// Tính lại giờ đến từng điểm sau khi người dùng đổi thứ tự / thêm / xoá
// (cùng công thức với backend: bắt đầu 08:00, từ ngày 2 mở đầu bằng bữa sáng thì 07:00, đi 30km/h)
export function retime(days: DraftDay[]): DraftDay[] {
  return days.map((d) => {
    let clock = d.day > 1 && d.stops[0] && mealOf(d.stops[0]) === "sang" ? BREAKFAST_START_MIN : DAY_START_MIN;
    return {
      ...d,
      stops: d.stops.map((s, i) => {
        if (i > 0) clock += travelMinutes(d.stops[i - 1].place, s.place);
        const meal = mealOf(s);
        if (meal) clock = Math.max(clock, MEAL_NOT_BEFORE[meal]);
        const stop = { ...s, startTime: formatTime(clock) };
        clock += s.place.durationMin;
        return stop;
      }),
    };
  });
}

export const formatDuration = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)} giờ${min % 60 ? ` ${min % 60} phút` : ""}` : `${min} phút`;
