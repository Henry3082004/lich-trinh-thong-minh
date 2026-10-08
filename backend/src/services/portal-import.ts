// Chuyển dữ liệu từ API của cổng du lịch Đắk Song (core-360.vnaapi.com) sang dạng Place của app.
// Hàm thuần, không gọi mạng, để test được bằng dữ liệu mẫu.

export type PortalLocation = {
  id: string;
  name: string;
  address?: string | null;
  content?: string | null;
  image?: string | null;
  lat: number;
  lng: number;
  link?: string | null;
  phone?: string | null;
  isActivated?: boolean;
};

export type PortalCategory = {
  id: string;
  name: string;
  isActivated?: boolean;
  travelLocations: PortalLocation[];
};

export type PlaceData = {
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

export type ConvertResult = {
  places: PlaceData[];
  skipped: { name: string; reason: string }[];
};

// Nhóm của cổng không phải điểm du lịch: bỏ qua
const SKIP_CATEGORIES = new Set(["Y tế, bệnh viện", "Cây giống"]);

const DEFAULT_IMAGE_BASE = "https://static.dggv.edu.vn";

// Thời gian tham quan là ƯỚC LƯỢNG theo loại (cổng không có dữ liệu này)
const DURATION_MIN: Record<string, number> = {
  "thien-nhien": 120,
  "van-hoa": 90,
  "trai-nghiem": 180,
  "am-thuc": 60,
  "luu-tru": 60,
};

const TAGS: Record<string, string[]> = {
  "thien-nhien": ["thien-nhien", "check-in"],
  "van-hoa": ["van-hoa"],
  "trai-nghiem": ["trai-nghiem", "gia-dinh", "check-in"],
  "am-thuc": ["am-thuc"],
  "luu-tru": ["luu-tru"],
};

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// "Di tích" của cổng gồm cả thác, núi lẫn chùa nên phải phân loại theo tên
function categoryFor(portalCategory: string, name: string): string | null {
  switch (portalCategory) {
    case "Ăn Uống":
    case "Nhà hàng":
      return "am-thuc";
    case "Nhà nghỉ, khách sạn":
      return "luu-tru";
    case "Địa điểm du lịch":
      return "trai-nghiem";
    case "Di tích":
      return /thác|suối|hồ|núi|bảo tồn|rừng|đèo/i.test(name) ? "thien-nhien" : "van-hoa";
    default:
      return null;
  }
}

export function convertPortalCategories(
  categories: PortalCategory[],
  options: { imageBase?: string } = {},
): ConvertResult {
  const imageBase = (options.imageBase ?? DEFAULT_IMAGE_BASE).replace(/\/$/, "");
  const places: PlaceData[] = [];
  const skipped: ConvertResult["skipped"] = [];
  const usedSlugs = new Set<string>();

  for (const cat of categories) {
    for (const loc of cat.travelLocations) {
      if (loc.isActivated === false) {
        skipped.push({ name: loc.name, reason: "đã tắt trên cổng" });
        continue;
      }
      if (SKIP_CATEGORIES.has(cat.name)) {
        skipped.push({ name: loc.name, reason: `nhóm "${cat.name}" không phải điểm du lịch` });
        continue;
      }
      const category = categoryFor(cat.name, loc.name);
      if (!category) {
        skipped.push({ name: loc.name, reason: `chưa hỗ trợ nhóm "${cat.name}"` });
        continue;
      }
      if (typeof loc.lat !== "number" || typeof loc.lng !== "number") {
        skipped.push({ name: loc.name, reason: "thiếu toạ độ" });
        continue;
      }

      let slug = slugify(loc.name);
      if (usedSlugs.has(slug)) slug = `${slug}-${loc.id.slice(0, 4)}`;
      usedSlugs.add(slug);

      places.push({
        slug,
        name: loc.name.trim(),
        category,
        description: loc.content?.trim() || `${cat.name} tại Đắk Song`,
        images: loc.image ? [`${imageBase}/${loc.image.replace(/^\//, "")}`] : [],
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address?.trim() || null,
        tags: TAGS[category],
        durationMin: DURATION_MIN[category],
        openHours: null,
        sourceUrl: null,
        phone: loc.phone?.trim() || null,
        mapLink: loc.link?.trim() || null,
      });
    }
  }

  // API không đảm bảo thứ tự: sắp theo slug để file dữ liệu ổn định giữa các lần nạp
  places.sort((a, b) => a.slug.localeCompare(b.slug));

  return { places, skipped };
}
