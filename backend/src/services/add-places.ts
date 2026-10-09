import { z } from "zod";

// Đọc danh sách địa điểm dạng bảng (dán từ Google Sheets: cột cách nhau bằng Tab, hoặc dấu |) thành dữ liệu cho places.json.
// Cột (theo thứ tự): Tên | Nhóm | Vị trí (toạ độ "12.27,107.61" hoặc link Google Maps đầy đủ) | Địa chỉ | Điện thoại | Giờ mở cửa | Giá | Mô tả | Tháng (lễ hội, vd "1-2")
export const BOUNDS = { latMin: 11.5, latMax: 12.8, lngMin: 107.2, lngMax: 108.0 };
const CENTER = { lat: 12.2659, lng: 107.609 }; // trung tâm thị trấn Đức An, dùng tạm khi chưa có vị trí

const CATEGORY_ALIASES: Record<string, string> = {
  "thien-nhien": "thien-nhien", "thiên nhiên": "thien-nhien", "danh thắng": "thien-nhien", thác: "thien-nhien", "thác nước": "thien-nhien",
  "van-hoa": "van-hoa", "văn hoá": "van-hoa", "văn hóa": "van-hoa", "di tích": "van-hoa", chùa: "van-hoa",
  "am-thuc": "am-thuc", "quán ăn": "am-thuc", "ẩm thực": "am-thuc", "nhà hàng": "am-thuc",
  "ca-phe": "ca-phe", "cà phê": "ca-phe", "quán cà phê": "ca-phe",
  "dac-san": "dac-san", "đặc sản": "dac-san", "món ăn": "dac-san",
  "le-hoi": "le-hoi", "lễ hội": "le-hoi", "sự kiện": "le-hoi",
  "trai-nghiem": "trai-nghiem", "trải nghiệm": "trai-nghiem", farm: "trai-nghiem", glamping: "trai-nghiem",
  "luu-tru": "luu-tru", "lưu trú": "luu-tru", homestay: "luu-tru", "khách sạn": "luu-tru", "nhà nghỉ": "luu-tru",
};
const DEFAULT_DURATION: Record<string, number> = { "thien-nhien": 120, "van-hoa": 90, "am-thuc": 60, "ca-phe": 60, "dac-san": 30, "le-hoi": 180, "trai-nghiem": 150, "luu-tru": 0 };

export function slugify(text: string): string {
  return text
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Lấy toạ độ từ "12.27,107.61" hoặc từ link Google Maps đầy đủ (…/@lat,lng,…, !3dLAT!4dLNG, ?q=lat,lng)
export function parseLocation(raw: string): { lat: number; lng: number } | null {
  const text = raw.trim();
  if (!text) return null;
  const m =
    text.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/) ??
    text.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/) ??
    text.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/) ??
    text.match(/[?&](?:q|query|ll|destination)=(-?\d{1,3}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

// "1-2", "1,2", "tháng 3", "12-1" (qua năm) -> [1,2] ...
export function parseMonths(raw: string): number[] {
  const nums = (raw.match(/\d{1,2}/g) ?? []).map(Number).filter((n) => n >= 1 && n <= 12);
  if (nums.length === 2 && /[-–~đến]/.test(raw)) {
    const [a, b] = nums;
    const out: number[] = [];
    for (let m = a; ; m = (m % 12) + 1) {
      out.push(m);
      if (m === b || out.length > 12) break;
    }
    return out;
  }
  return [...new Set(nums)];
}

const rowSchema = z.object({ name: z.string().min(2).max(120) });

export type NewPlace = {
  slug: string; name: string; category: string; description: string; images: string[];
  lat: number; lng: number; address: string | null; tags: string[]; durationMin: number;
  openHours: string | null; sourceUrl: string | null; phone: string | null; mapLink: string | null;
  kind: "place" | "dish" | "festival"; season: string | null; months: number[]; priceNote: string | null;
  imageCredits: string[]; sourceUrls: string[]; approxLocation: boolean;
};

export function parsePlaces(text: string, existing: { slug: string; name: string }[]): { places: NewPlace[]; errors: string[]; warnings: string[] } {
  const places: NewPlace[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const slugs = new Set(existing.map((p) => p.slug));
  const names = new Set(existing.map((p) => p.name.trim().toLowerCase()));

  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim());
  lines.forEach((line, idx) => {
    const cols = (line.includes("\t") ? line.split("\t") : line.split("|")).map((c) => c.trim());
    const at = `Dòng ${idx + 1}`;
    if (idx === 0 && /^(tên|name)$/i.test(cols[0])) return; // dòng tiêu đề
    const [name = "", cat = "", loc = "", address = "", phone = "", hours = "", price = "", desc = "", monthsRaw = ""] = cols;
    if (!rowSchema.safeParse({ name }).success) return void errors.push(`${at}: thiếu hoặc sai tên`);
    const category = CATEGORY_ALIASES[cat.toLowerCase()];
    if (!category) return void errors.push(`${at} (${name}): nhóm "${cat}" không hợp lệ. Dùng: thiên nhiên, văn hoá, quán ăn, cà phê, đặc sản, lễ hội, trải nghiệm, lưu trú`);
    const slug = slugify(name);
    if (!slug) return void errors.push(`${at} (${name}): tên không tạo được mã`);
    if (slugs.has(slug) || names.has(name.toLowerCase())) return void errors.push(`${at} (${name}): trùng với địa điểm đã có`);

    let point = parseLocation(loc);
    let approx = false;
    if (loc && !point) warnings.push(`${at} (${name}): không đọc được vị trí "${loc.slice(0, 40)}", tạm dùng vị trí chung`);
    if (point && (point.lat < BOUNDS.latMin || point.lat > BOUNDS.latMax || point.lng < BOUNDS.lngMin || point.lng > BOUNDS.lngMax)) {
      return void errors.push(`${at} (${name}): toạ độ ${point.lat},${point.lng} nằm ngoài vùng Đắk Song (kiểm tra lại, có thể ngược số hoặc nhầm dấu)`);
    }
    if (!point) {
      point = CENTER;
      approx = true;
    }
    const months = category === "le-hoi" ? parseMonths(monthsRaw) : [];
    if (category === "le-hoi" && months.length === 0) warnings.push(`${at} (${name}): lễ hội chưa có tháng diễn ra nên AI không lọc theo mùa được`);

    slugs.add(slug);
    names.add(name.toLowerCase());
    places.push({
      slug, name, category,
      description: desc || (category === "ca-phe" ? "Quán cà phê ở Đắk Song." : ""),
      images: [], lat: point.lat, lng: point.lng, address: address || null, tags: [category],
      durationMin: DEFAULT_DURATION[category] ?? 60, openHours: hours || null, sourceUrl: null, phone: phone || null,
      // Có toạ độ thì dùng link chỉ đường theo toạ độ; chưa có thì tìm theo tên
      mapLink: approx ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} Đắk Song`)}` : /^https?:\/\//.test(loc) ? loc : null,
      kind: category === "le-hoi" ? "festival" : category === "dac-san" ? "dish" : "place",
      season: null, months, priceNote: price || null, imageCredits: [], sourceUrls: [], approxLocation: approx,
    });
  });
  return { places, errors, warnings };
}
