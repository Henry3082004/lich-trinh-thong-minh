import { describe, expect, it } from "vitest";
import fixture from "./fixtures/portal-travel-category.json";
import { convertPortalCategories, slugify, type PortalCategory } from "../src/services/portal-import";

const data = fixture.data as PortalCategory[];

describe("convertPortalCategories", () => {
  const { places, skipped } = convertPortalCategories(data);
  const bySlug = (s: string) => places.find((p) => p.slug === s);

  it("nạp 13 điểm, bỏ Y tế và Cây giống", () => {
    expect(places).toHaveLength(13);
    expect(skipped.map((s) => s.name).sort()).toEqual(["Hoàng- Dung Farm", "Trung tâm y tế huyện đắk song"]);
  });

  it("phân loại theo nhóm và theo tên với nhóm Di tích", () => {
    expect(bySlug("thac-luu-ly")?.category).toBe("thien-nhien");
    expect(bySlug("khu-bao-ton-thien-nhien-nam-nung")?.category).toBe("thien-nhien");
    expect(bySlug("thien-vien-truc-lam-dao-nguyen")?.category).toBe("van-hoa");
    expect(bySlug("higg-farm-glamping-coffee")?.category).toBe("trai-nghiem");
    expect(bySlug("bun-cha-quat")?.category).toBe("am-thuc");
    expect(bySlug("nha-hang-gun")?.category).toBe("am-thuc");
    expect(bySlug("nha-nghi-thien-huong")?.category).toBe("luu-tru");
  });

  it("slug là duy nhất và không dấu", () => {
    const slugs = places.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((s) => /^[a-z0-9-]+$/.test(s))).toBe(true);
  });

  it("giữ nguyên toạ độ, điện thoại và link bản đồ", () => {
    const p = bySlug("bun-cha-quat")!;
    expect(p.lat).toBe(12.284783257659528);
    expect(p.lng).toBe(107.59647422345435);
    expect(p.phone).toBe("0981302444");
    expect(p.mapLink).toBe("https://goo.gl/maps/2iCoG39vAcDm29BP7");
    expect(bySlug("pho-bo-bac-hai")?.phone).toBeNull();
  });

  it("ghép đường dẫn ảnh với CDN, cho phép đổi CDN", () => {
    expect(bySlug("thac-luu-ly")?.images).toEqual(["https://static.dggv.edu.vn/360/1679365135640_daknong-thac-luu-ly.jpg"]);
    const other = convertPortalCategories(data, { imageBase: "https://cdn.example.com/" });
    expect(other.places[0].images[0]).toMatch(/^https:\/\/cdn\.example\.com\/360\//);
  });

  it("mô tả để trống thì dùng mô tả thay thế", () => {
    expect(bySlug("nha-hang-hai-san-tung")?.description).toBe("Nhà hàng tại Đắk Song");
  });

  it("gán thời gian tham quan và tag theo loại", () => {
    expect(bySlug("thac-luu-ly")).toMatchObject({ durationMin: 120, tags: ["thien-nhien", "check-in"] });
    expect(bySlug("bun-cha-quat")).toMatchObject({ durationMin: 60, tags: ["am-thuc"] });
  });

  it("bỏ qua địa điểm thiếu toạ độ hoặc bị tắt", () => {
    const broken: PortalCategory[] = [
      {
        id: "c",
        name: "Ăn Uống",
        travelLocations: [
          { id: "1", name: "A", lat: undefined as unknown as number, lng: 1 },
          { id: "2", name: "B", lat: 1, lng: 1, isActivated: false },
        ],
      },
    ];
    const r = convertPortalCategories(broken);
    expect(r.places).toHaveLength(0);
    expect(r.skipped.map((s) => s.reason)).toEqual(["thiếu toạ độ", "đã tắt trên cổng"]);
  });
});

describe("slugify", () => {
  it("bỏ dấu tiếng Việt", () => {
    expect(slugify("Thác Lưu Ly")).toBe("thac-luu-ly");
    expect(slugify("Đắk Song")).toBe("dak-song");
  });
});
