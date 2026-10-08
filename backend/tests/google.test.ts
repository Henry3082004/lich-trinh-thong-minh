import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { config } from "../src/config";
import { prisma } from "../src/lib/prisma";
import { _clearGoogleCacheForTests } from "../src/services/google-places";

const app = createApp();
let placeId = "";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const SEARCH_OK = { places: [{ id: "ChIJabc", location: { latitude: 12.0, longitude: 107.5 } }] };
const review = (i: number, text = `Rất đẹp ${i}`) => ({
  rating: 5,
  relativePublishTimeDescription: "1 tháng trước",
  text: { text },
  authorAttribution: { displayName: `Khách ${i}` },
});
const DETAILS_OK = {
  rating: 4.6,
  userRatingCount: 321,
  googleMapsUri: "https://maps.google.com/?cid=1",
  googleMapsLinks: { reviewsUri: "https://maps.google.com/?cid=1&review=1" },
  reviews: [1, 2, 3, 4, 5, 6].map((i) => review(i, i === 1 ? "x".repeat(900) : undefined)),
};

beforeAll(async () => {
  await prisma.place.deleteMany();
  const p = await prisma.place.create({
    data: { slug: "thac-test", name: "Thác Test", category: "thien-nhien", description: "test", images: [], lat: 12.0, lng: 107.5, address: "Đắk Song" },
  });
  placeId = p.id;
});
beforeEach(() => {
  _clearGoogleCacheForTests();
  config.googleMapsApiKey = "test-key";
});
afterEach(() => {
  vi.unstubAllGlobals();
  config.googleMapsApiKey = "";
});
afterAll(() => prisma.$disconnect());

describe("GET /api/places/:id/google", () => {
  it("chưa cấu hình khoá thì trả 503 và không gọi Google", async () => {
    config.googleMapsApiKey = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).get(`/api/places/${placeId}/google`);
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trả điểm sao + tối đa 5 review, cắt review dài, link thẳng tới phần đánh giá, không lộ khoá", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(SEARCH_OK)).mockResolvedValueOnce(json(DETAILS_OK));
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).get("/api/places/thac-test/google");
    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4.6);
    expect(res.body.ratingCount).toBe(321);
    expect(res.body.reviews).toHaveLength(5);
    expect(res.body.reviews[0].text.length).toBe(400);
    expect(res.body.reviews[1]).toMatchObject({ author: "Khách 2", rating: 5, when: "1 tháng trước" });
    expect(res.body.reviewsUrl).toBe("https://maps.google.com/?cid=1&review=1");
    expect(res.body.source).toBe("Google Maps");
    expect(JSON.stringify(res.body)).not.toContain("test-key");
    // Khoá gửi qua header, không nằm trong URL
    const [searchUrl, searchInit] = fetchMock.mock.calls[0];
    expect(String(searchUrl)).not.toContain("test-key");
    expect((searchInit as RequestInit).headers).toMatchObject({ "x-goog-api-key": "test-key" });
  });

  it("lần thứ hai lấy từ bộ nhớ đệm, không gọi lại Google", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(SEARCH_OK)).mockResolvedValueOnce(json(DETAILS_OK));
    vi.stubGlobal("fetch", fetchMock);
    await request(app).get(`/api/places/${placeId}/google`);
    const again = await request(app).get(`/api/places/${placeId}/google`);
    expect(again.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("trường googleMapsLinks bị từ chối (400) thì thử lại không có nó và dùng link trang địa điểm", async () => {
    const { googleMapsLinks: _drop, ...noLinks } = DETAILS_OK;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(SEARCH_OK))
      .mockResolvedValueOnce(json({ error: "invalid field" }, 400))
      .mockResolvedValueOnce(json(noLinks));
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).get(`/api/places/${placeId}/google`);
    expect(res.status).toBe(200);
    expect(res.body.reviewsUrl).toBe("https://maps.google.com/?cid=1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("kết quả tìm kiếm ở quá xa điểm đến thì coi là không tìm thấy (tránh nhầm địa điểm)", async () => {
    const far = { places: [{ id: "ChIJfar", location: { latitude: 10.8, longitude: 106.7 } }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json(far)));
    const res = await request(app).get(`/api/places/${placeId}/google`);
    expect(res.status).toBe(404);
  });

  it("Google trả lỗi thì báo 502, không lộ chi tiết", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({ error: { message: "API key invalid: test-key" } }, 403)));
    const res = await request(app).get(`/api/places/${placeId}/google`);
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain("test-key");
  });

  it("điểm đến không tồn tại thì 404", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).get("/api/places/khong-co/google");
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
