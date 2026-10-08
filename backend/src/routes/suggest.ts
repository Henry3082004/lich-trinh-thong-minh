import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/http";
import { suggestItinerary } from "../services/suggest";

export const suggestBody = z.object({
  days: z.number().int().min(1).max(7),
  interests: z.array(z.string()).max(10).default([]),
  pace: z.enum(["relaxed", "normal", "packed"]).default("normal"),
});

export const suggestRouter = Router();

suggestRouter.post(
  "/suggest",
  asyncHandler(async (req, res) => {
    const input = suggestBody.parse(req.body);
    const places = await prisma.place.findMany();
    const days = suggestItinerary(places, input);

    // Gắn thông tin điểm đến để frontend hiển thị ngay, không phải gọi thêm API
    const byId = new Map(places.map((p) => [p.id, p]));
    res.json({
      ...input,
      schedule: days.map((d) => ({
        ...d,
        stops: d.stops.map((s) => ({ ...s, place: byId.get(s.placeId) })),
      })),
    });
  }),
);
