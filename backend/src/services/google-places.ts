import { config } from "../config";
import { HttpError } from "../lib/http";

// Lấy điểm đánh giá và vài review của một địa điểm từ Google Places API (New).
// Chỉ gọi khi khách xem điểm đó và giữ bộ nhớ đệm ngắn; không lưu review vào database (điều khoản của Google).
const BASE = "https://places.googleapis.com/v1";
const TIMEOUT_MS = 8000;
const DETAILS_TTL_MS = 6 * 60 * 60 * 1000;
const MISS_TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const MAX_REVIEWS = 5;
const MAX_REVIEW_CHARS = 400;
// Kết quả tìm kiếm cách toạ độ của điểm quá xa thì coi là nhầm địa điểm
const MAX_DISTANCE_M = 1500;

export type GoogleReview = { author: string; rating: number; text: string; when: string };
export type GoogleInfo = {
  rating: number | null;
  ratingCount: number;
  reviews: GoogleReview[];
  mapsUrl: string;
  reviewsUrl: string;
  source: "Google Maps";
};

type PlaceInput = { id: string; name: string; address: string | null; lat: number; lng: number };

const placeIds = new Map<string, string | null>(); // id điểm → place_id của Google (null = không tìm thấy)
const missAt = new Map<string, number>();
const details = new Map<string, { info: GoogleInfo; expiresAt: number }>();

export function _clearGoogleCacheForTests() {
  placeIds.clear();
  missAt.clear();
  details.clear();
}

function remember<T>(map: Map<string, T>, key: string, value: T) {
  map.delete(key);
  map.set(key, value);
  if (map.size > MAX_ENTRIES) map.delete(map.keys().next().value as string);
}

function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

async function call(path: string, init: RequestInit & { fieldMask: string }): Promise<Response> {
  const { fieldMask, ...rest } = init;
  try {
    return await fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": config.googleMapsApiKey,
        "x-goog-fieldmask": fieldMask,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(502, "Không kết nối được Google Maps");
  }
}

async function findPlaceId(place: PlaceInput): Promise<string | null> {
  if (placeIds.has(place.id)) {
    const cached = placeIds.get(place.id) ?? null;
    if (cached) return cached;
    if ((missAt.get(place.id) ?? 0) + MISS_TTL_MS > Date.now()) return null;
  }
  const res = await call("/places:searchText", {
    method: "POST",
    fieldMask: "places.id,places.location",
    body: JSON.stringify({
      textQuery: `${place.name} ${place.address ?? "Đắk Song, Đắk Nông"}`,
      languageCode: "vi",
      maxResultCount: 1,
      locationBias: { circle: { center: { latitude: place.lat, longitude: place.lng }, radius: 1000 } },
    }),
  });
  if (!res.ok) throw new HttpError(502, "Google Maps từ chối yêu cầu");
  const body = (await res.json()) as { places?: { id?: string; location?: { latitude: number; longitude: number } }[] };
  const hit = body.places?.[0];
  const near =
    hit?.id && hit.location ? distanceM(place.lat, place.lng, hit.location.latitude, hit.location.longitude) <= MAX_DISTANCE_M : false;
  if (!hit?.id || !near) {
    remember(placeIds, place.id, null);
    missAt.set(place.id, Date.now());
    return null;
  }
  remember(placeIds, place.id, hit.id);
  return hit.id;
}

type RawDetails = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  googleMapsLinks?: { reviewsUri?: string; placeUri?: string };
  reviews?: {
    rating?: number;
    relativePublishTimeDescription?: string;
    text?: { text?: string };
    originalText?: { text?: string };
    authorAttribution?: { displayName?: string };
  }[];
};

async function fetchDetails(googleId: string): Promise<RawDetails> {
  const path = `/places/${encodeURIComponent(googleId)}?languageCode=vi`;
  const base = "rating,userRatingCount,reviews,googleMapsUri";
  // Trường googleMapsLinks (link thẳng tới phần đánh giá) có thể chưa có ở mọi tài khoản: lỗi 400 thì thử lại không có nó
  let res = await call(path, { method: "GET", fieldMask: `${base},googleMapsLinks` });
  if (res.status === 400) res = await call(path, { method: "GET", fieldMask: base });
  if (!res.ok) throw new HttpError(502, "Google Maps từ chối yêu cầu");
  return (await res.json()) as RawDetails;
}

export async function getGoogleInfo(place: PlaceInput): Promise<GoogleInfo> {
  if (!config.googleMapsApiKey) throw new HttpError(503, "Chưa cấu hình Google Maps");
  const cached = details.get(place.id);
  if (cached && cached.expiresAt > Date.now()) return cached.info;

  const googleId = await findPlaceId(place);
  if (!googleId) throw new HttpError(404, "Không tìm thấy địa điểm này trên Google Maps");

  const raw = await fetchDetails(googleId);
  const fallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(googleId)}`;
  const mapsUrl = raw.googleMapsLinks?.placeUri ?? raw.googleMapsUri ?? fallback;
  const info: GoogleInfo = {
    rating: typeof raw.rating === "number" ? raw.rating : null,
    ratingCount: raw.userRatingCount ?? 0,
    reviews: (raw.reviews ?? [])
      .map((r) => ({
        author: r.authorAttribution?.displayName ?? "Người dùng Google",
        rating: r.rating ?? 0,
        text: (r.text?.text ?? r.originalText?.text ?? "").trim().slice(0, MAX_REVIEW_CHARS),
        when: r.relativePublishTimeDescription ?? "",
      }))
      .filter((r) => r.text)
      .slice(0, MAX_REVIEWS),
    mapsUrl,
    reviewsUrl: raw.googleMapsLinks?.reviewsUri ?? mapsUrl,
    source: "Google Maps",
  };
  remember(details, place.id, { info, expiresAt: Date.now() + DETAILS_TTL_MS });
  return info;
}
