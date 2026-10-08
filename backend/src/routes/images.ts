import net from "node:net";
import { Router } from "express";
import { config } from "../config";
import { asyncHandler, HttpError } from "../lib/http";
import { sniffImage, type ImageMime } from "../lib/image";
import { rateLimit } from "../lib/rate-limit";

// Proxy ảnh: máy chủ ảnh của cổng không có header CORS nên trình duyệt không cho vẽ ảnh
// đó vào poster. Backend lấy ảnh rồi trả lại kèm CORS. Chỉ lấy từ máy chủ trong danh sách trắng.
const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const CACHE_MAX_ENTRIES = 40;
const CACHE_TTL_MS = 60 * 60 * 1000;

type Cached = { buf: Buffer; mime: ImageMime; expiresAt: number };
const cache = new Map<string, Cached>(); // Map giữ thứ tự thêm vào, dùng làm LRU đơn giản

export function parseAllowedUrl(raw: unknown): URL {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) throw new HttpError(400, "Thiếu hoặc sai địa chỉ ảnh");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError(400, "Địa chỉ ảnh không hợp lệ");
  }
  if (url.protocol !== "https:") throw new HttpError(400, "Chỉ nhận địa chỉ https");
  if (url.username || url.password || (url.port && url.port !== "443")) throw new HttpError(400, "Địa chỉ ảnh không hợp lệ");
  if (net.isIP(url.hostname)) throw new HttpError(403, "Không cho phép địa chỉ IP");
  if (!config.imageHosts.includes(url.hostname.toLowerCase())) throw new HttpError(403, "Máy chủ ảnh không được phép");
  return url;
}

async function download(url: URL): Promise<Buffer> {
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => {
    throw new HttpError(502, "Không tải được ảnh");
  });
  // Chặn chuyển hướng: tránh bị dẫn sang máy chủ nằm ngoài danh sách trắng
  if (res.status >= 300 && res.status < 400) throw new HttpError(502, "Máy chủ ảnh chuyển hướng, không được phép");
  if (!res.ok || !res.body) throw new HttpError(502, "Không tải được ảnh");

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) throw new HttpError(413, "Ảnh quá lớn");

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new HttpError(413, "Ảnh quá lớn");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export const imagesRouter = Router();

imagesRouter.get(
  "/img",
  rateLimit({ windowMs: 60_000, max: 240, key: (req) => req.ip ?? "unknown" }),
  asyncHandler(async (req, res) => {
    const url = parseAllowedUrl(req.query.u);
    const key = url.toString();

    let entry = cache.get(key);
    if (entry && entry.expiresAt <= Date.now()) {
      cache.delete(key);
      entry = undefined;
    }
    if (!entry) {
      const buf = await download(url);
      const mime = sniffImage(buf);
      if (!mime) throw new HttpError(415, "Tệp tải về không phải ảnh");
      entry = { buf, mime, expiresAt: Date.now() + CACHE_TTL_MS };
      cache.set(key, entry);
      if (cache.size > CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    }

    res.set({
      "Content-Type": entry.mime,
      "Cache-Control": "public, max-age=86400",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-Content-Type-Options": "nosniff",
    });
    res.send(entry.buf);
  }),
);

export const _clearImageCacheForTests = () => cache.clear();
