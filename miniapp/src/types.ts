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
  approxLocation: boolean; // chưa có vị trí chính xác: chỉ đường theo tên, di chuyển ước lượng
  kind: "place" | "dish" | "festival";
  season: string | null; // lễ hội: vd "Tháng 3 âm lịch"
  months: number[]; // lễ hội: tháng dương lịch thường diễn ra
  priceNote: string | null;
  imageCredits: string[]; // ghi công ảnh (tác giả, giấy phép)
  sourceUrls: string[];
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

// Nhóm nội dung hiển thị khi khám phá và lọc (có thêm lưu trú, cà phê, đặc sản, lễ hội; không dùng làm "sở thích" khi tạo nhanh)

// Nhóm hiển thị khi lọc danh sách điểm đến (có thêm Lưu trú, nhưng không dùng làm "sở thích" khi tạo lịch)
export const PLACE_CATEGORIES = [
  ...CATEGORIES,
  { id: "ca-phe", name: "Cà phê", icon: "☕" },
  { id: "dac-san", name: "Đặc sản", icon: "🍜" },
  { id: "le-hoi", name: "Lễ hội", icon: "🎊" },
  { id: "luu-tru", name: "Lưu trú", icon: "🛏️" },
] as const;

// Chuyến đi do AI lên lịch
export type Transport = "o-to" | "xe-may" | "xe-khach";
export type Party = "solo" | "couple" | "friends" | "family";
export type Purpose = "sightseeing" | "nature";
export type TripPrefs = {
  party?: Party;
  purposes?: Purpose[];
  people: number;
  kids: number;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  days: number;
  transport: Transport;
  pace: Pace;
};
export type PlanStop = { placeId: string; startTime: string; travelMinFromPrev: number; note: string | null; suggested: boolean };
export type PlanResponse = {
  days: { day: number; date: string; stops: PlanStop[] }[];
  lodgingIds: string[];
  warnings: string[];
  summary: string;
  questions: string[];
  places: Place[];
  usedAi?: boolean;
};

export const categoryName = (id: string) => PLACE_CATEGORIES.find((c) => c.id === id)?.name ?? id;
export const categoryIcon = (id: string) => PLACE_CATEGORIES.find((c) => c.id === id)?.icon ?? "📍";
