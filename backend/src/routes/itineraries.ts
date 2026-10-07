import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, HttpError } from "../lib/http";
import { requireUser } from "../middleware/auth";

const itemSchema = z.object({
  day: z.number().int().min(1),
  order: z.number().int().min(1),
  placeId: z.string().min(1),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "startTime phải có dạng HH:mm")
    .optional(),
  note: z.string().max(500).optional(),
});

const itinerarySchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    days: z.number().int().min(1).max(7),
    interests: z.array(z.string()).max(10).default([]),
    items: z.array(itemSchema).max(100).default([]),
  })
  .refine((v) => v.items.every((i) => i.day <= v.days), {
    message: "day của item vượt quá số ngày của lịch trình",
    path: ["items"],
  });

const include = {
  items: { orderBy: [{ day: "asc" as const }, { order: "asc" as const }], include: { place: true } },
};

async function assertPlacesExist(placeIds: string[]) {
  const unique = [...new Set(placeIds)];
  const count = await prisma.place.count({ where: { id: { in: unique } } });
  if (count !== unique.length) throw new HttpError(400, "Có placeId không tồn tại");
}

async function findOwned(id: string, userId: string) {
  const itinerary = await prisma.itinerary.findUnique({ where: { id } });
  if (!itinerary) throw new HttpError(404, "Không tìm thấy lịch trình");
  if (itinerary.userId !== userId) throw new HttpError(403, "Bạn không có quyền với lịch trình này");
  return itinerary;
}

export const itinerariesRouter = Router();

// Xem lịch được chia sẻ: công khai, chỉ đọc, không lộ thông tin chủ sở hữu
itinerariesRouter.get(
  "/share/:shareId",
  asyncHandler(async (req, res) => {
    const itinerary = await prisma.itinerary.findUnique({ where: { shareId: req.params.shareId }, include });
    if (!itinerary) throw new HttpError(404, "Không tìm thấy lịch trình");
    const { userId: _userId, ...publicData } = itinerary;
    res.json(publicData);
  }),
);

itinerariesRouter.use("/itineraries", requireUser);

itinerariesRouter.get(
  "/itineraries",
  asyncHandler(async (req, res) => {
    const list = await prisma.itinerary.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
      include,
    });
    res.json(list);
  }),
);

itinerariesRouter.post(
  "/itineraries",
  asyncHandler(async (req, res) => {
    const body = itinerarySchema.parse(req.body);
    await assertPlacesExist(body.items.map((i) => i.placeId));
    const created = await prisma.itinerary.create({
      data: {
        userId: req.user!.id,
        title: body.title,
        days: body.days,
        interests: body.interests,
        shareId: crypto.randomBytes(8).toString("base64url"),
        items: { create: body.items },
      },
      include,
    });
    res.status(201).json(created);
  }),
);

itinerariesRouter.get(
  "/itineraries/:id",
  asyncHandler(async (req, res) => {
    await findOwned(req.params.id, req.user!.id);
    res.json(await prisma.itinerary.findUnique({ where: { id: req.params.id }, include }));
  }),
);

// PUT thay toàn bộ nội dung lịch trình (kể cả danh sách điểm)
itinerariesRouter.put(
  "/itineraries/:id",
  asyncHandler(async (req, res) => {
    await findOwned(req.params.id, req.user!.id);
    const body = itinerarySchema.parse(req.body);
    await assertPlacesExist(body.items.map((i) => i.placeId));
    const updated = await prisma.$transaction(async (tx) => {
      await tx.itineraryItem.deleteMany({ where: { itineraryId: req.params.id } });
      return tx.itinerary.update({
        where: { id: req.params.id },
        data: {
          title: body.title,
          days: body.days,
          interests: body.interests,
          items: { create: body.items },
        },
        include,
      });
    });
    res.json(updated);
  }),
);

itinerariesRouter.delete(
  "/itineraries/:id",
  asyncHandler(async (req, res) => {
    await findOwned(req.params.id, req.user!.id);
    await prisma.itinerary.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
