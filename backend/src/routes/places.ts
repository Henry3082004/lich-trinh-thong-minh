import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, HttpError } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { getGoogleInfo } from "../services/google-places";

export const CATEGORIES = [
  { id: "thien-nhien", name: "Thiên nhiên" },
  { id: "van-hoa", name: "Văn hóa" },
  { id: "am-thuc", name: "Ẩm thực" },
  { id: "trai-nghiem", name: "Trải nghiệm" },
  { id: "luu-tru", name: "Lưu trú" },
];

export const placesRouter = Router();

placesRouter.get("/categories", (_req, res) => {
  res.json(CATEGORIES);
});

const listQuery = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
});

placesRouter.get(
  "/places",
  asyncHandler(async (req, res) => {
    const { category, tag } = listQuery.parse(req.query);
    const places = await prisma.place.findMany({
      where: { category, ...(tag ? { tags: { has: tag } } : {}) },
      orderBy: { name: "asc" },
    });
    res.json(places);
  }),
);

placesRouter.get(
  "/places/:id",
  asyncHandler(async (req, res) => {
    const place = await prisma.place.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
    });
    if (!place) throw new HttpError(404, "Không tìm thấy điểm đến");
    res.json(place);
  }),
);

// Điểm sao và vài review của Google Maps cho một điểm đến (cần GOOGLE_MAPS_API_KEY).
// Công khai như danh sách điểm đến; giới hạn tần suất để không tốn hạn mức Google.
placesRouter.get(
  "/places/:id/google",
  rateLimit({ windowMs: 60_000, max: 60, key: (req) => req.ip ?? "unknown" }),
  asyncHandler(async (req, res) => {
    const place = await prisma.place.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
    });
    if (!place) throw new HttpError(404, "Không tìm thấy điểm đến");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(await getGoogleInfo(place));
  }),
);
