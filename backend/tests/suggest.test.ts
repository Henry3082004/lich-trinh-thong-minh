import { describe, expect, it } from "vitest";
import { suggestItinerary, type SuggestPlace } from "../src/services/suggest";

const place = (id: string, category: string, tags: string[], lat: number, lng: number, durationMin = 60): SuggestPlace => ({
  id,
  name: id,
  category,
  tags,
  lat,
  lng,
  durationMin,
});

const PLACES: SuggestPlace[] = [
  place("thac-a", "thien-nhien", ["thien-nhien"], 12.24, 107.62),
  place("thac-b", "thien-nhien", ["thien-nhien"], 12.241, 107.621),
  place("ho-c", "thien-nhien", ["thien-nhien", "check-in"], 12.3, 107.7),
  place("lang-d", "van-hoa", ["van-hoa"], 12.242, 107.622),
  place("lang-e", "van-hoa", ["van-hoa"], 12.31, 107.71),
  place("trai-f", "trai-nghiem", ["trai-nghiem"], 12.243, 107.623),
  place("quan-g", "am-thuc", ["am-thuc"], 12.2405, 107.6205),
  place("quan-h", "am-thuc", ["am-thuc"], 12.305, 107.705),
  place("ks-i", "luu-tru", ["luu-tru"], 12.24, 107.62),
];

describe("suggestItinerary", () => {
  it("trả đúng số ngày và không lặp điểm", () => {
    const days = suggestItinerary(PLACES, { days: 2, interests: [], pace: "normal" });
    expect(days).toHaveLength(2);
    const ids = days.flatMap((d) => d.stops.map((s) => s.placeId));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("không đưa điểm lưu trú vào tuyến", () => {
    const days = suggestItinerary(PLACES, { days: 3, interests: [], pace: "packed" });
    const ids = days.flatMap((d) => d.stops.map((s) => s.placeId));
    expect(ids).not.toContain("ks-i");
  });

  it("ưu tiên điểm khớp sở thích", () => {
    const [day1] = suggestItinerary(PLACES, { days: 1, interests: ["van-hoa"], pace: "relaxed" });
    expect(day1.stops[0].placeId).toMatch(/^lang-/);
  });

  it("tôn trọng số điểm tối đa theo nhịp độ", () => {
    for (const [pace, max] of [["relaxed", 3], ["normal", 4], ["packed", 5]] as const) {
      const days = suggestItinerary(PLACES, { days: 1, interests: [], pace });
      expect(days[0].stops.length).toBeLessThanOrEqual(max);
    }
  });

  it("mỗi ngày có một điểm ẩm thực khi còn", () => {
    const days = suggestItinerary(PLACES, { days: 2, interests: [], pace: "normal" });
    for (const d of days) {
      const food = d.stops.filter((s) => s.placeId.startsWith("quan-"));
      expect(food).toHaveLength(1);
    }
  });

  it("giờ bắt đầu tăng dần từ 08:00", () => {
    const [day1] = suggestItinerary(PLACES, { days: 1, interests: [], pace: "normal" });
    expect(day1.stops[0].startTime).toBe("08:00");
    const times = day1.stops.map((s) => s.startTime);
    expect([...times].sort()).toEqual(times);
  });

  it("dừng sớm khi hết điểm thay vì trả ngày rỗng", () => {
    const days = suggestItinerary(PLACES.slice(0, 2), { days: 5, interests: [], pace: "relaxed" });
    expect(days.length).toBeLessThanOrEqual(2);
    expect(days.every((d) => d.stops.length > 0)).toBe(true);
  });

  it("cùng đầu vào cho cùng kết quả", () => {
    const input = { days: 2, interests: ["thien-nhien"], pace: "normal" as const };
    expect(suggestItinerary(PLACES, input)).toEqual(suggestItinerary(PLACES, input));
  });

  it("ngày kín lịch tham quan vẫn chừa chỗ cho bữa ăn", () => {
    // 3 điểm tham quan dài 150 phút: nếu xếp hết thì không còn chỗ cho bữa ăn
    const long = [
      place("a", "thien-nhien", ["thien-nhien"], 12.24, 107.62, 150),
      place("b", "thien-nhien", ["thien-nhien"], 12.241, 107.621, 150),
      place("c", "thien-nhien", ["thien-nhien"], 12.242, 107.622, 150),
      place("d", "thien-nhien", ["thien-nhien"], 12.243, 107.623, 150),
      place("quan", "am-thuc", ["am-thuc"], 12.2405, 107.6205, 60),
    ];
    const [day1] = suggestItinerary(long, { days: 1, interests: [], pace: "relaxed" });
    expect(day1.stops.some((s) => s.placeId === "quan")).toBe(true);
    expect(day1.totalMinutes).toBeLessThanOrEqual(6 * 60);
  });
});

