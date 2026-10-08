import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { _clearImageCacheForTests } from "../src/routes/images";
import { sniffImage } from "../src/lib/image";

const app = createApp();
const OK_URL = "https://static.dggv.edu.vn/360/anh.jpg";
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(2000, 1)]);

const reply = (body: Buffer | string, init: ResponseInit = {}) =>
  new Response(body, { status: 200, headers: { "content-type": "application/octet-stream" }, ...init });

beforeEach(() => _clearImageCacheForTests());
afterEach(() => vi.unstubAllGlobals());

describe("GET /api/img", () => {
  it("trả ảnh kèm CORS và cache, nhận dạng bằng byte đầu dù header là octet-stream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(JPEG));
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).get("/api/img").query({ u: OK_URL }).set("Origin", "https://web.example.com");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(res.headers["cache-control"]).toContain("max-age=86400");
    expect(res.headers["access-control-allow-origin"]).toBeTruthy();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.body.length).toBe(JPEG.length);
  });

  it("lần thứ hai lấy từ bộ nhớ đệm, không gọi lại máy chủ ảnh", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(JPEG));
    vi.stubGlobal("fetch", fetchMock);
    await request(app).get("/api/img").query({ u: OK_URL });
    await request(app).get("/api/img").query({ u: OK_URL });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["thiếu tham số", undefined, 400],
    ["không phải URL", "khong-phai-url", 400],
    ["http thường", "http://static.dggv.edu.vn/a.jpg", 400],
    ["máy chủ lạ", "https://evil.example.com/a.jpg", 403],
    ["tên miền giả mạo dạng đuôi", "https://static.dggv.edu.vn.evil.com/a.jpg", 403],
    ["địa chỉ IP", "https://127.0.0.1/a.jpg", 403],
    ["IP nội bộ cloud", "https://169.254.169.254/latest/meta-data", 403],
    ["có tài khoản trong URL", "https://user:pw@static.dggv.edu.vn/a.jpg", 400],
    ["cổng lạ", "https://static.dggv.edu.vn:8443/a.jpg", 400],
  ])("từ chối: %s", async (_name, u, status) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await request(app).get("/api/img").query(u === undefined ? {} : { u });
    expect(res.status).toBe(status);
    expect(fetchMock).not.toHaveBeenCalled(); // bị chặn trước khi gọi ra ngoài
  });

  it("từ chối khi máy chủ ảnh chuyển hướng", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://evil.example.com/x" } })));
    const res = await request(app).get("/api/img").query({ u: OK_URL });
    expect(res.status).toBe(502);
  });

  it("từ chối tệp không phải ảnh", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply("<html>không phải ảnh</html>")));
    const res = await request(app).get("/api/img").query({ u: OK_URL });
    expect(res.status).toBe(415);
  });

  it("từ chối ảnh quá lớn (theo content-length)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(JPEG, { headers: { "content-length": String(6 * 1024 * 1024) } })));
    const res = await request(app).get("/api/img").query({ u: OK_URL });
    expect(res.status).toBe(413);
  });

  it("từ chối ảnh quá lớn khi vừa tải vừa đếm (không có content-length)", async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(6 * 1024 * 1024, 7)]);
    const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(big)); c.close(); } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream, { status: 200 })));
    const res = await request(app).get("/api/img").query({ u: OK_URL });
    expect(res.status).toBe(413);
  });

  it("báo 502 khi máy chủ ảnh lỗi", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("lỗi", { status: 500 })));
    expect((await request(app).get("/api/img").query({ u: OK_URL })).status).toBe(502);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect((await request(app).get("/api/img").query({ u: OK_URL })).status).toBe(502);
  });
});

describe("sniffImage", () => {
  it("nhận dạng JPEG, PNG, WebP, GIF và từ chối còn lại", () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImage(Buffer.from("RIFF0000WEBPVP8 "))).toBe("image/webp");
    expect(sniffImage(Buffer.from("GIF89a"))).toBe("image/gif");
    expect(sniffImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniffImage(Buffer.from("MZ\x90\x00"))).toBeNull();
    expect(sniffImage(Buffer.alloc(0))).toBeNull();
  });
});
