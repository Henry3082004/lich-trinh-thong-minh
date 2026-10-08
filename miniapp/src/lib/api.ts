import type { Draft, Itinerary, Place, SuggestInput, SuggestResponse } from "../types";
import { mockApi, mockPlaces, mockSuggest } from "./mock";
import { authHeaders } from "./zalo";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const API_BASE = BASE;
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true" || !BASE;

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) Object.assign(headers, await authHeaders());
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init.headers as object) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Lỗi ${res.status}`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

// Chuyển lịch đang chỉnh thành body cho POST/PUT /api/itineraries
function toBody(draft: Draft) {
  return {
    title: draft.title,
    days: draft.schedule.length,
    interests: draft.interests,
    items: draft.schedule.flatMap((d) =>
      d.stops.map((s, i) => ({
        day: d.day,
        order: i + 1,
        placeId: s.place.id,
        ...(s.startTime ? { startTime: s.startTime } : {}),
        ...(s.note ? { note: s.note } : {}),
      })),
    ),
  };
}

export const api = {
  places: async (category?: string): Promise<Place[]> => {
    if (USE_MOCK) return mockPlaces.filter((p) => !category || p.category === category);
    return request(`/api/places${category ? `?category=${encodeURIComponent(category)}` : ""}`);
  },

  place: async (id: string): Promise<Place> => {
    if (USE_MOCK) {
      const p = mockPlaces.find((x) => x.id === id);
      if (!p) throw new Error("Không tìm thấy điểm đến");
      return p;
    }
    return request(`/api/places/${encodeURIComponent(id)}`);
  },

  suggest: async (input: SuggestInput): Promise<SuggestResponse> => {
    if (USE_MOCK) return mockSuggest(input);
    return request("/api/suggest", { method: "POST", body: JSON.stringify(input) });
  },

  myItineraries: async (): Promise<Itinerary[]> => {
    if (USE_MOCK) return mockApi.list();
    return request("/api/itineraries", {}, true);
  },

  itinerary: async (id: string): Promise<Itinerary> => {
    if (USE_MOCK) {
      const it = mockApi.get(id);
      if (!it) throw new Error("Không tìm thấy lịch trình");
      return it;
    }
    return request(`/api/itineraries/${id}`, {}, true);
  },

  save: async (draft: Draft): Promise<Itinerary> => {
    const body = toBody(draft);
    if (USE_MOCK) {
      const items = body.items.map((it, i) => ({
        ...it,
        id: String(i),
        startTime: it.startTime ?? null,
        note: it.note ?? null,
        place: mockPlaces.find((p) => p.id === it.placeId)!,
      }));
      return mockApi.save({ ...body, items }, draft.id);
    }
    return draft.id
      ? request(`/api/itineraries/${draft.id}`, { method: "PUT", body: JSON.stringify(body) }, true)
      : request("/api/itineraries", { method: "POST", body: JSON.stringify(body) }, true);
  },

  remove: async (id: string): Promise<void> => {
    if (USE_MOCK) return mockApi.remove(id);
    await request(`/api/itineraries/${id}`, { method: "DELETE" }, true);
  },
};
