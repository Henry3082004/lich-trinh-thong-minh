// Khớp với response của backend (xem docs/api.md)

export type Pace = "relaxed" | "normal" | "packed";

export type Place = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  lat: number;
  lng: number;
  address: string | null;
  tags: string[];
  durationMin: number;
  openHours: string | null;
  sourceUrl: string | null;
  phone: string | null;
  mapLink: string | null;
};

// Điểm sao + vài review từ Google Maps (backend gọi Places API; có thể không có)
export type GoogleReview = { author: string; rating: number; text: string; when: string };
export type GoogleInfo = {
  rating: number | null;
  ratingCount: number;
  reviews: GoogleReview[];
  mapsUrl: string;
  reviewsUrl: string;
  source: string;
};

export type SuggestInput = { days: number; interests: string[]; pace: Pace };

export type SuggestResponse = SuggestInput & {
  schedule: {
    day: number;
    totalMinutes: number;
    stops: { placeId: string; order: number; startTime: string; travelMinFromPrev: number; place: Place }[];
  }[];
};

export type ItineraryItem = {
  id: string;
  day: number;
  order: number;
  placeId: string;
  startTime: string | null;
  note: string | null;
  place: Place;
};

export type Itinerary = {
  id: string;
  title: string;
  days: number;
  interests: string[];
  shareId: string;
  createdAt: string;
  updatedAt: string;
  items: ItineraryItem[];
};

// Lịch đang chỉnh trên máy (chưa chắc đã lưu lên server)
export type DraftStop = { place: Place; startTime?: string; note?: string };
export type DraftDay = { day: number; stops: DraftStop[] };
export type Draft = {
  id?: string; // có id = đã lưu trên server
  title: string;
  interests: string[];
  pace: Pace;
  schedule: DraftDay[];
};

export const CATEGORIES = [
  { id: "thien-nhien", name: "Thiên nhiên", icon: "⛰️" },
  { id: "van-hoa", name: "Văn hóa", icon: "🪘" },
  { id: "am-thuc", name: "Ẩm thực", icon: "🍲" },
  { id: "trai-nghiem", name: "Trải nghiệm", icon: "🏕️" },
] as const;

// Nhóm hiển thị khi lọc danh sách điểm đến (có thêm Lưu trú, nhưng không dùng làm "sở thích" khi tạo lịch)
export const PLACE_CATEGORIES = [...CATEGORIES, { id: "luu-tru", name: "Lưu trú", icon: "🛏️" }] as const;

export const categoryName = (id: string) => PLACE_CATEGORIES.find((c) => c.id === id)?.name ?? id;
export const categoryIcon = (id: string) => PLACE_CATEGORIES.find((c) => c.id === id)?.icon ?? "📍";
