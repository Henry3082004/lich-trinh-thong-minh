import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { CART_MAX_ITEMS } from "../src/routes/cart";

const app = createApp();
const alice = { "X-Dev-User": "alice-cart" };
const bob = { "X-Dev-User": "bob-cart" };
const ids: string[] = [];

beforeAll(async () => {
  await prisma.cartItem.deleteMany();
  await prisma.place.deleteMany();
  for (let i = 0; i < CART_MAX_ITEMS + 1; i++) {
    const p = await prisma.place.create({
      data: { slug: `cart-${i}`, name: `Điểm ${i}`, category: i % 2 ? "am-thuc" : "thien-nhien", description: "t", images: [], lat: 12, lng: 107.5 },
    });
    ids.push(p.id);
  }
});
beforeEach(() => prisma.cartItem.deleteMany());
afterAll(() => prisma.$disconnect());

describe("/api/cart", () => {
  it("cần đăng nhập", async () => {
    expect((await request(app).get("/api/cart")).status).toBe(401);
    expect((await request(app).post("/api/cart").send({ placeId: ids[0] })).status).toBe(401);
  });

  it("giỏ mới trống; thêm theo id hoặc slug; thêm trùng không nhân đôi", async () => {
    expect((await request(app).get("/api/cart").set(alice)).body).toEqual([]);
    const first = await request(app).post("/api/cart").set(alice).send({ placeId: ids[0] });
    expect(first.status).toBe(201);
    expect(first.body.map((p: { id: string }) => p.id)).toEqual([ids[0]]);
    const dup = await request(app).post("/api/cart").set(alice).send({ placeId: "cart-0" });
    expect(dup.status).toBe(200);
    expect(dup.body).toHaveLength(1);
    const second = await request(app).post("/api/cart").set(alice).send({ placeId: ids[1] });
    expect(second.body.map((p: { id: string }) => p.id)).toEqual([ids[0], ids[1]]); // theo thứ tự thêm
  });

  it("mỗi người một giỏ riêng", async () => {
    await request(app).post("/api/cart").set(alice).send({ placeId: ids[0] });
    expect((await request(app).get("/api/cart").set(bob)).body).toEqual([]);
  });

  it("điểm không tồn tại thì 404, thiếu placeId thì 400", async () => {
    expect((await request(app).post("/api/cart").set(alice).send({ placeId: "khong-co" })).status).toBe(404);
    expect((await request(app).post("/api/cart").set(alice).send({})).status).toBe(400);
  });

  it("xoá một mục và xoá cả giỏ", async () => {
    await request(app).post("/api/cart").set(alice).send({ placeId: ids[0] });
    await request(app).post("/api/cart").set(alice).send({ placeId: ids[1] });
    const afterOne = await request(app).delete(`/api/cart/${ids[0]}`).set(alice);
    expect(afterOne.body.map((p: { id: string }) => p.id)).toEqual([ids[1]]);
    expect((await request(app).delete("/api/cart").set(alice)).body).toEqual([]);
    expect((await request(app).get("/api/cart").set(alice)).body).toEqual([]);
  });

  it(`giới hạn ${CART_MAX_ITEMS} mục, thêm mục thứ ${CART_MAX_ITEMS + 1} bị từ chối`, async () => {
    for (let i = 0; i < CART_MAX_ITEMS; i++) await request(app).post("/api/cart").set(alice).send({ placeId: ids[i] });
    const over = await request(app).post("/api/cart").set(alice).send({ placeId: ids[CART_MAX_ITEMS] });
    expect(over.status).toBe(409);
    // thêm lại mục đã có vẫn được
    expect((await request(app).post("/api/cart").set(alice).send({ placeId: ids[0] })).status).toBe(200);
  });
});
