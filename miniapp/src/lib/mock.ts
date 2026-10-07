// Dữ liệu giả theo đúng JSON của docs/api.md, dùng khi VITE_USE_MOCK=true hoặc chưa có backend
import type { Itinerary, Place, SuggestInput, SuggestResponse } from "../types";
import rawPlaces from "./mock-places.json";
import { retime } from "./schedule";

export const mockPlaces: Place[] = rawPlaces.map((p) => ({ ...p, id: p.slug }));

const STORAGE_KEY = "mock-itineraries";
const PACE_STOPS = { relaxed: 3, normal: 4, packed: 5 } as const;

function load(): Itinerary[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
const store = (list: Itinerary[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

// Phiên bản đơn giản của thuật toán backend: ưu tiên sở thích, mỗi ngày 1 điểm ẩm thực
export function mockSuggest(input: SuggestInput): SuggestResponse {
  const score = (p: Place) => input.interests.filter((i) => p.category === i || p.tags.includes(i)).length;
  const sights = mockPlaces.filter((p) => p.category !== "am-thuc").sort((a, b) => score(b) - score(a));
  const foods = mockPlaces.filter((p) => p.category === "am-thuc");
  const perDay = PACE_STOPS[input.pace] - 1;

  const days = Array.from({ length: input.days }, (_, i) => {
    const picked = sights.slice(i * perDay, (i + 1) * perDay);
    if (foods[i]) picked.splice(Math.ceil(picked.length / 2), 0, foods[i]);
    return { day: i + 1, stops: picked.map((place) => ({ place })) };
  }).filter((d) => d.stops.length > 0);

  return {
    ...input,
    schedule: retime(days).map((d) => ({
      day: d.day,
      totalMinutes: 0,
      stops: d.stops.map((s, i) => ({
        placeId: s.place.id,
        order: i + 1,
        startTime: s.startTime ?? "08:00",
        travelMinFromPrev: 0,
        place: s.place,
      })),
    })),
  };
}

export const mockApi = {
  list: () => load(),
  get: (id: string) => load().find((i) => i.id === id),
  getShared: (shareId: string) => load().find((i) => i.shareId === shareId),
  save: (data: Omit<Itinerary, "id" | "shareId" | "createdAt" | "updatedAt">, id?: string) => {
    const list = load();
    const now = new Date().toISOString();
    const existing = id ? list.find((i) => i.id === id) : undefined;
    const saved: Itinerary = existing
      ? { ...existing, ...data, updatedAt: now }
      : { ...data, id: crypto.randomUUID(), shareId: crypto.randomUUID().slice(0, 8), createdAt: now, updatedAt: now };
    store([saved, ...list.filter((i) => i.id !== saved.id)]);
    return saved;
  },
  remove: (id: string) => store(load().filter((i) => i.id !== id)),
};
