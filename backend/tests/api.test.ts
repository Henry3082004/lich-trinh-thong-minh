import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

const app = createApp();
const alice = { "X-Dev-User": "alice" };
const bob = { "X-Dev-User": "bob" };
let placeIds: string[] = [];

beforeAll(async () => {
  await prisma.itineraryItem.deleteMany();
  await prisma.itinerary.deleteMany();
  await prisma.user.deleteMany();
  await prisma.place.deleteMany();
  const data = [
    { slug: "a", name: "A", category: "thien-nhien", tags: ["thien-nhien"], lat: 12.24, lng: 107.62 },
    { slug: "b", name: "B", category: "van-hoa", tags: ["van-hoa"], lat: 12.25, lng: 107.63 },
    { slug: "c", name: "C", category: "am-thuc", tags: ["am-thuc"], lat: 12.245, lng: 107.625 },
  ];
  for (const d of data) {
    const p = await prisma.place.create({ data: { ...d, description: "test", images: [] } });
    placeIds.push(p.id);
  }
});

afterAll(() => prisma.$disconnect());

describe("API", () => {
  it("GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/places lọc theo danh mục", async () => {
    const res = await request(app).get("/api/places?category=van-hoa");
    expect(res.status).toBe(200);
    expect(res.body.map((p: { slug: string }) => p.slug)).toEqual(["b"]);
  });

  it("GET /api/places/:id nhận cả slug, 404 khi không có", async () => {
    expect((await request(app).get("/api/places/a")).body.name).toBe("A");
    expect((await request(app).get("/api/places/khong-co")).status).toBe(404);
  });

  it("POST /api/suggest trả lịch kèm thông tin điểm", async () => {
    const res = await request(app).post("/api/suggest").send({ days: 1, interests: ["van-hoa"] });
    expect(res.status).toBe(200);
    expect(res.body.schedule[0].stops[0].place.slug).toBe("b");
  });

  it("POST /api/suggest 400 khi dữ liệu sai", async () => {
    const res = await request(app).post("/api/suggest").send({ days: 0 });
    expect(res.status).toBe(400);
  });

  it("401 khi thiếu token", async () => {
    expect((await request(app).get("/api/itineraries")).status).toBe(401);
  });

  it("CRUD lịch trình + chia sẻ + phân quyền", async () => {
    const created = await request(app)
      .post("/api/itineraries")
      .set(alice)
      .send({
        title: "Chuyến 1",
        days: 1,
        items: [
          { day: 1, order: 1, placeId: placeIds[0], startTime: "08:00" },
          { day: 1, order: 2, placeId: placeIds[1] },
        ],
      });
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect(created.body.items).toHaveLength(2);

    expect((await request(app).get("/api/itineraries").set(alice)).body).toHaveLength(1);
    expect((await request(app).get("/api/itineraries").set(bob)).body).toHaveLength(0);
    expect((await request(app).get(`/api/itineraries/${id}`).set(bob)).status).toBe(403);
    expect((await request(app).delete(`/api/itineraries/${id}`).set(bob)).status).toBe(403);

    const updated = await request(app)
      .put(`/api/itineraries/${id}`)
      .set(alice)
      .send({ title: "Chuyến 1 (sửa)", days: 1, items: [{ day: 1, order: 1, placeId: placeIds[2] }] });
    expect(updated.status).toBe(200);
    expect(updated.body.items.map((i: { placeId: string }) => i.placeId)).toEqual([placeIds[2]]);

    const shared = await request(app).get(`/api/share/${created.body.shareId}`);
    expect(shared.status).toBe(200);
    expect(shared.body.title).toBe("Chuyến 1 (sửa)");
    expect(shared.body.userId).toBeUndefined();

    expect((await request(app).delete(`/api/itineraries/${id}`).set(alice)).status).toBe(204);
    expect((await request(app).get(`/api/share/${created.body.shareId}`)).status).toBe(404);
  });

  it("400 khi placeId không tồn tại hoặc day vượt số ngày", async () => {
    const bad = await request(app)
      .post("/api/itineraries")
      .set(alice)
      .send({ title: "x", days: 1, items: [{ day: 1, order: 1, placeId: "khong-co" }] });
    expect(bad.status).toBe(400);
    const badDay = await request(app)
      .post("/api/itineraries")
      .set(alice)
      .send({ title: "x", days: 1, items: [{ day: 2, order: 1, placeId: placeIds[0] }] });
    expect(badDay.status).toBe(400);
  });
});

describe("đăng nhập Zalo (chế độ dev/demo có dự phòng)", () => {
  const zaloOk = () => new Response(JSON.stringify({ id: "z-123", name: "Khách Zalo" }), { status: 200 });
  const zaloBad = () => new Response(JSON.stringify({ error: -216, message: "invalid token" }), { status: 200 });

  it("thẻ Zalo hợp lệ thì dùng tài khoản Zalo thật, kể cả khi có kèm mã khách", async () => {
    const fetchMock = vi.fn().mockResolvedValue(zaloOk());
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).get("/api/cart").set({ Authorization: "Bearer tok-ok-1", "X-Dev-User": "zalo-abc" });
    expect(res.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { zaloId: "z-123" } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { zaloId: "dev:zalo-abc" } })).toBeNull();
    vi.unstubAllGlobals();
  });

  it("thẻ Zalo lỗi hoặc Zalo không trả lời thì dùng mã khách (không báo lỗi 401)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(zaloBad()));
    const bad = await request(app).get("/api/cart").set({ Authorization: "Bearer tok-bad-2", "X-Dev-User": "zalo-guest-1" });
    expect(bad.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { zaloId: "dev:zalo-guest-1" } })).not.toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("mạng lỗi")));
    const down = await request(app).get("/api/cart").set({ Authorization: "Bearer tok-down-3", "X-Dev-User": "zalo-guest-2" });
    expect(down.status).toBe(200);
    vi.unstubAllGlobals();
  });

  it("thẻ lỗi và không có mã khách thì vẫn 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(zaloBad()));
    expect((await request(app).get("/api/cart").set({ Authorization: "Bearer tok-bad-4" })).status).toBe(401);
    vi.unstubAllGlobals();
  });
});
