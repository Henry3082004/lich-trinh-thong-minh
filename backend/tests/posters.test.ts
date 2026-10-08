import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { deleteExpiredPosters } from "../src/routes/posters";

const app = createApp();
const alice = { "X-Dev-User": "alice-poster" };
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(3000, 2)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(3000, 3)]);

beforeAll(async () => {
  await prisma.poster.deleteMany();
});
beforeEach(async () => {
  await prisma.poster.deleteMany();
});
afterAll(() => prisma.$disconnect());

const upload = (body: Buffer, type = "image/jpeg", headers: Record<string, string> = alice) =>
  request(app).post("/api/posters").set(headers).set("Content-Type", type).send(body);

describe("/api/posters", () => {
  it("cần đăng nhập để tải ảnh lên", async () => {
    expect((await upload(JPEG, "image/jpeg", {})).status).toBe(401);
  });

  it("tải JPEG lên rồi mở bằng link công khai (không cần đăng nhập) ra đúng ảnh", async () => {
    const created = await upload(JPEG);
    expect(created.status).toBe(201);
    expect(created.body.url).toMatch(/\/api\/posters\/[A-Za-z0-9_-]{16}\.jpg$/);

    const path = new URL(created.body.url).pathname;
    const got = await request(app).get(path); // không có header đăng nhập
    expect(got.status).toBe(200);
    expect(got.headers["content-type"]).toBe("image/jpeg");
    expect(got.headers["cache-control"]).toContain("max-age");
    expect(Buffer.compare(got.body, JPEG)).toBe(0);
  });

  it("nhận PNG và trả đuôi .png", async () => {
    const created = await upload(PNG, "image/png");
    expect(created.status).toBe(201);
    expect(created.body.url).toMatch(/\.png$/);
    expect((await request(app).get(new URL(created.body.url).pathname)).headers["content-type"]).toBe("image/png");
  });

  it("từ chối đuôi file sai với loại thật của ảnh", async () => {
    const created = await upload(JPEG);
    const wrong = new URL(created.body.url).pathname.replace(".jpg", ".png");
    expect((await request(app).get(wrong)).status).toBe(404);
  });

  it("từ chối nội dung không phải ảnh dù khai báo là JPEG", async () => {
    const fake = Buffer.concat([Buffer.from("<html><script>alert(1)</script></html>"), Buffer.alloc(3000, 32)]);
    expect((await upload(fake)).status).toBe(415);
  });

  it("từ chối loại tệp khác (svg, html, json)", async () => {
    expect((await upload(Buffer.alloc(3000, 1), "image/svg+xml")).status).toBe(415);
    expect((await upload(Buffer.alloc(3000, 1), "text/html")).status).toBe(415);
  });

  it("từ chối ảnh quá nhỏ và quá lớn", async () => {
    expect((await upload(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]))).status).toBe(400);
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(3 * 1024 * 1024, 5)]);
    expect((await upload(big)).status).toBe(413);
  });

  it("id không tồn tại hoặc sai định dạng thì 404", async () => {
    expect((await request(app).get("/api/posters/khongcoanhnay12345.jpg")).status).toBe(404);
    expect((await request(app).get("/api/posters/../etc/passwd")).status).toBe(404);
    expect((await request(app).get("/api/posters/abc.jpg")).status).toBe(404);
  });

  it("ảnh hết hạn thì 404 và bị dọn", async () => {
    const created = await upload(JPEG);
    const id = created.body.id as string;
    await prisma.poster.update({ where: { id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await request(app).get(new URL(created.body.url).pathname)).status).toBe(404);
    expect(await deleteExpiredPosters()).toBe(1);
    expect(await prisma.poster.count()).toBe(0);
  });

  it("không xoá ảnh còn hạn khi dọn", async () => {
    await upload(JPEG);
    expect(await deleteExpiredPosters()).toBe(0);
    expect(await prisma.poster.count()).toBe(1);
  });
});
