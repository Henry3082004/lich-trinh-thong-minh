import crypto from "node:crypto";
import express, { Router } from "express";
import { config } from "../config";
import { asyncHandler, HttpError } from "../lib/http";
import { extensionOf, sniffImage } from "../lib/image";
import { prisma } from "../lib/prisma";
import { rateLimit } from "../lib/rate-limit";
import { requireUser } from "../middleware/auth";

// Ảnh lịch trình do người dùng tạo (JPEG/PNG), lưu tạm để Zalo có link công khai khi chia sẻ.
const MAX_BYTES = 2 * 1024 * 1024;
const MIN_BYTES = 1024;

export const postersRouter = Router();

postersRouter.post(
  "/posters",
  requireUser,
  rateLimit({ windowMs: 60 * 60 * 1000, max: Number(process.env.POSTER_UPLOADS_PER_HOUR ?? 30), key: (req) => req.user?.id ?? req.ip ?? "?" }),
  express.raw({ type: ["image/jpeg", "image/png"], limit: MAX_BYTES }),
  asyncHandler(async (req, res) => {
    const body = req.body as Buffer | undefined;
    if (!Buffer.isBuffer(body) || body.length === 0) throw new HttpError(415, "Chỉ nhận ảnh JPEG hoặc PNG");
    if (body.length < MIN_BYTES) throw new HttpError(400, "Ảnh quá nhỏ");

    // Không tin content-type của người gửi: kiểm tra byte đầu của file
    const mime = sniffImage(body);
    if (mime !== "image/jpeg" && mime !== "image/png") throw new HttpError(415, "Chỉ nhận ảnh JPEG hoặc PNG");

    const id = crypto.randomBytes(12).toString("base64url");
    await prisma.poster.create({
      data: { id, mime, data: new Uint8Array(body), expiresAt: new Date(Date.now() + config.posterTtlDays * 24 * 60 * 60 * 1000) },
    });

    const base = config.publicBaseUrl || `${req.protocol}://${req.get("host")}`;
    res.status(201).json({ id, url: `${base}/api/posters/${id}.${extensionOf(mime)}` });
  }),
);

// Công khai: id dài, không đoán được, nên chỉ người có link mới xem được
postersRouter.get(
  "/posters/:file",
  asyncHandler(async (req, res) => {
    const match = /^([A-Za-z0-9_-]{8,40})\.(jpg|png)$/.exec(req.params.file);
    if (!match) throw new HttpError(404, "Không tìm thấy ảnh");
    const poster = await prisma.poster.findUnique({ where: { id: match[1] } });
    const ext = poster ? extensionOf(poster.mime as "image/jpeg" | "image/png") : "";
    if (!poster || poster.expiresAt <= new Date() || ext !== match[2]) throw new HttpError(404, "Không tìm thấy ảnh");

    res.set({
      "Content-Type": poster.mime,
      "Cache-Control": "public, max-age=86400",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-Content-Type-Options": "nosniff",
    });
    res.send(Buffer.from(poster.data));
  }),
);

export async function deleteExpiredPosters(now = new Date()): Promise<number> {
  const { count } = await prisma.poster.deleteMany({ where: { expiresAt: { lte: now } } });
  return count;
}
