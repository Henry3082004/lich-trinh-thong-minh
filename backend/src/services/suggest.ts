// Thuật toán gợi ý lịch trình: hàm thuần, không đụng database, dễ test.

export type Pace = "relaxed" | "normal" | "packed";

export type SuggestPlace = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  lat: number;
  lng: number;
  durationMin: number;
};

export type SuggestInput = {
  days: number;
  interests: string[];
  pace: Pace;
};

export type SuggestedStop = {
  placeId: string;
  order: number;
  startTime: string; // "HH:mm"
  travelMinFromPrev: number;
};

export type SuggestedDay = {
  day: number;
  stops: SuggestedStop[];
  totalMinutes: number;
};

export const FOOD_CATEGORY = "am-thuc";
// Lưu trú không phải điểm tham quan nên không đưa vào tuyến
const EXCLUDED_CATEGORIES = new Set(["luu-tru"]);

const PACE_RULES: Record<Pace, { maxStops: number; maxMinutes: number }> = {
  relaxed: { maxStops: 3, maxMinutes: 6 * 60 },
  normal: { maxStops: 4, maxMinutes: 8 * 60 },
  packed: { maxStops: 5, maxMinutes: 10 * 60 },
};

const DAY_START_MIN = 8 * 60;
// Thời gian chừa lại cho bữa ăn (ăn + di chuyển) khi còn điểm ẩm thực,
// để ngày kín lịch tham quan vẫn có chỗ chèn bữa ăn
const FOOD_RESERVE_MIN = 90;
const AVG_SPEED_KMH = 30; // đường đồi núi, ước lượng thận trọng
// 1 điểm sở thích = đáng đi thêm bao nhiêu km
const KM_PER_SCORE = 10;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function travelMinutes(a: SuggestPlace, b: SuggestPlace): number {
  return Math.round((haversineKm(a, b) / AVG_SPEED_KMH) * 60);
}

// Số sở thích trùng với tag hoặc danh mục của điểm
export function interestScore(place: SuggestPlace, interests: string[]): number {
  if (interests.length === 0) return 1;
  const keys = new Set([place.category, ...place.tags]);
  return interests.filter((i) => keys.has(i)).length;
}

const formatTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Thứ tự ổn định khi bằng điểm, để cùng đầu vào luôn ra cùng kết quả
const byId = (a: SuggestPlace, b: SuggestPlace) => a.id.localeCompare(b.id);

function routeMinutes(route: SuggestPlace[]): number {
  let total = 0;
  route.forEach((p, i) => {
    total += p.durationMin + (i > 0 ? travelMinutes(route[i - 1], p) : 0);
  });
  return total;
}

export function suggestItinerary(places: SuggestPlace[], input: SuggestInput): SuggestedDay[] {
  const rules = PACE_RULES[input.pace];
  const candidates = places.filter((p) => !EXCLUDED_CATEGORIES.has(p.category));
  const score = new Map(candidates.map((p) => [p.id, interestScore(p, input.interests)]));

  // Điểm khớp sở thích được ưu tiên; điểm không khớp chỉ dùng để lấp chỗ trống
  const sights = candidates
    .filter((p) => p.category !== FOOD_CATEGORY)
    .sort((a, b) => score.get(b.id)! - score.get(a.id)! || byId(a, b));
  const foods = candidates.filter((p) => p.category === FOOD_CATEGORY).sort(byId);

  const used = new Set<string>();
  const result: SuggestedDay[] = [];

  for (let day = 1; day <= input.days; day++) {
    const seed = sights.find((p) => !used.has(p.id));
    if (!seed) break;

    const route: SuggestPlace[] = [seed];
    used.add(seed.id);
    // Chừa 1 chỗ cho bữa ăn nếu còn điểm ẩm thực
    const foodAvailable = foods.some((f) => !used.has(f.id));
    const sightSlots = rules.maxStops - (foodAvailable ? 1 : 0);
    const sightMinutesCap = rules.maxMinutes - (foodAvailable ? FOOD_RESERVE_MIN : 0);

    // Tham lam: từ điểm hiện tại, chọn điểm có (sở thích cao, gần) tốt nhất mà vẫn vừa thời gian
    while (route.length < sightSlots) {
      const current = route[route.length - 1];
      let best: SuggestPlace | undefined;
      let bestUtility = -Infinity;
      for (const p of sights) {
        if (used.has(p.id)) continue;
        if (routeMinutes([...route, p]) > sightMinutesCap) continue;
        const utility = score.get(p.id)! * KM_PER_SCORE - haversineKm(current, p);
        if (utility > bestUtility) {
          best = p;
          bestUtility = utility;
        }
      }
      if (!best) break;
      route.push(best);
      used.add(best.id);
    }

    // Chèn điểm ẩm thực gần nhất vào giữa ngày (giờ ăn trưa)
    if (foodAvailable) {
      const insertAt = Math.ceil(route.length / 2);
      const anchor = route[insertAt - 1];
      const food = foods
        .filter((f) => !used.has(f.id))
        .sort((a, b) => haversineKm(anchor, a) - haversineKm(anchor, b) || byId(a, b))
        .find((f) => {
          const withFood = [...route.slice(0, insertAt), f, ...route.slice(insertAt)];
          return routeMinutes(withFood) <= rules.maxMinutes;
        });
      if (food) {
        route.splice(insertAt, 0, food);
        used.add(food.id);
      }
    }

    let clock = DAY_START_MIN;
    const stops = route.map((p, i) => {
      const travel = i > 0 ? travelMinutes(route[i - 1], p) : 0;
      clock += travel;
      const stop = { placeId: p.id, order: i + 1, startTime: formatTime(clock), travelMinFromPrev: travel };
      clock += p.durationMin;
      return stop;
    });

    result.push({ day, stops, totalMinutes: clock - DAY_START_MIN });
  }

  return result;
}
