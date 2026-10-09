import { describe, expect, it } from "vitest";
import { parseLocation, parseMonths, parsePlaces, slugify } from "../src/services/add-places";

const existing = [{ slug: "thac-luu-ly", name: "Thác Lưu Ly" }];

describe("parseLocation", () => {
  it("đọc toạ độ thường và các kiểu link Google Maps đầy đủ", () => {
    expect(parseLocation("12.2701, 107.6112")).toEqual({ lat: 12.2701, lng: 107.6112 });
    expect(parseLocation("https://www.google.com/maps/place/Quan/@12.2701,107.6112,17z/data=x")).toEqual({ lat: 12.2701, lng: 107.6112 });
    expect(parseLocation("https://www.google.com/maps/place/Q/data=!4m6!3d12.31!4d107.5")).toEqual({ lat: 12.31, lng: 107.5 });
    expect(parseLocation("https://www.google.com/maps?q=12.3,107.4")).toEqual({ lat: 12.3, lng: 107.4 });
  });
  it("link rút gọn hoặc rỗng thì không có toạ độ", () => {
    expect(parseLocation("https://maps.app.goo.gl/xZsks7iicaniTfDJ8")).toBeNull();
    expect(parseLocation("")).toBeNull();
  });
});

describe("parseMonths", () => {
  it("khoảng, danh sách, qua năm", () => {
    expect(parseMonths("1-2")).toEqual([1, 2]);
    expect(parseMonths("tháng 3")).toEqual([3]);
    expect(parseMonths("1,4")).toEqual([1, 4]);
    expect(parseMonths("12-2")).toEqual([12, 1, 2]);
    expect(parseMonths("")).toEqual([]);
  });
});

describe("parsePlaces", () => {
  it("nhận dòng đầy đủ, bỏ dòng tiêu đề, sinh mã và trường mặc định", () => {
    const text = ["Tên\tNhóm\tVị trí", "Quán Gió Núi\tCà phê\t12.2701,107.6112\tThôn 3, Đức An\t0912345678\t07:00-22:00\t30-50k\tView đồi"].join("\n");
    const { places, errors } = parsePlaces(text, existing);
    expect(errors).toEqual([]);
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ slug: "quan-gio-nui", category: "ca-phe", lat: 12.2701, lng: 107.6112, approxLocation: false, phone: "0912345678", openHours: "07:00-22:00", priceNote: "30-50k", description: "View đồi", durationMin: 60 });
  });
  it("thiếu vị trí thì dùng tạm vị trí chung, đánh dấu approxLocation và chỉ đường theo tên", () => {
    const { places } = parsePlaces("Quán Mới | quán ăn", existing);
    expect(places[0].approxLocation).toBe(true);
    expect(places[0].mapLink).toContain("query=");
  });
  it("lễ hội lấy tháng; báo lỗi nhóm sai, trùng tên, toạ độ ngoài vùng, thiếu tên", () => {
    const text = [
      "Lễ hội sum họp\tlễ hội\t12.27,107.6\t\t\t\t\t\t1-2",
      "Quán X\tkhông biết\t12.27,107.6",
      "Thác Lưu Ly\tthác\t12.27,107.6",
      "Quán Y\tcà phê\t107.6,12.27",
      "\tcà phê\t12.27,107.6",
    ].join("\n");
    const { places, errors } = parsePlaces(text, existing);
    expect(places.map((p) => p.slug)).toEqual(["le-hoi-sum-hop"]);
    expect(places[0]).toMatchObject({ kind: "festival", months: [1, 2] });
    expect(errors).toHaveLength(4);
    expect(errors.join("\n")).toMatch(/nhóm/);
    expect(errors.join("\n")).toMatch(/trùng/);
    expect(errors.join("\n")).toMatch(/ngoài vùng/);
  });
  it("hai dòng cùng tên trong một file thì dòng sau bị bỏ", () => {
    const { places, errors } = parsePlaces("A Quán\tcà phê\nA Quán\tcà phê", []);
    expect(places).toHaveLength(1);
    expect(errors).toHaveLength(1);
  });
  it("slugify bỏ dấu tiếng Việt", () => {
    expect(slugify("Đắk Song – Thác Lưu Ly!")).toBe("dak-song-thac-luu-ly");
  });
});
