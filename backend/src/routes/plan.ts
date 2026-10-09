import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import { asyncHandler, HttpError } from "../lib/http";
import { prisma } from "../lib/prisma";
import { rateLimit } from "../lib/rate-limit";
import { requireUser } from "../middleware/auth";
import { buildPlan, planWithAi, prefsSchema, reviseWithAi, type PlanPlace } from "../services/planner";

export const planRouter = Router();

planRouter.use(
  "/plan",
  requireUser,
  rateLimit({ windowMs: 60 * 60 * 1000, max: config.planPerHour, key: (req) => req.user?.id ?? req.ip ?? "?" }),
);

const select = { id: true, name: true, category: true, kind: true, description: true, address: true, lat: true, lng: true, approxLocation: true, durationMin: true, months: true, season: true } as const;

async function load(userId: string) {
  const [all, cartRows] = await Promise.all([
    prisma.place.findMany({ select, orderBy: { name: "asc" } }),
    prisma.cartItem.findMany({ where: { userId }, orderBy: { addedAt: "asc" }, select: { place: { select } } }),
  ]);
  return { all: all as PlanPlace[], cart: cartRows.map((r) => r.place) as PlanPlace[] };
}

// Trả kèm thông tin điểm đến để app hiện được ngay, không phải gọi lại từng điểm
async function withPlaces(plan: ReturnType<typeof buildPlan>, extra: Record<string, unknown> = {}) {
  const ids = new Set([...plan.days.flatMap((d) => d.stops.map((s) => s.placeId)), ...plan.lodgingIds]);
  const places = await prisma.place.findMany({ where: { id: { in: [...ids] } } });
  return { ...plan, ...extra, places };
}

planRouter.post(
  "/plan",
  asyncHandler(async (req, res) => {
    const prefs = prefsSchema.parse(req.body?.prefs);
    const loaded = await load(req.user!.id);
    const all = loaded.all;
    const cart = prefs.autoPick ? [] : loaded.cart;
    if (all.length === 0) throw new HttpError(409, "Chưa có dữ liệu điểm đến");
    const { draft, usedAi } = await planWithAi(prefs, cart, all);
    res.json(await withPlaces(buildPlan(prefs, cart, all, draft), { usedAi }));
  }),
);

const reviseBody = z.object({
  prefs: prefsSchema,
  message: z.string().trim().min(1).max(500),
  plan: z.object({ days: z.array(z.object({ stops: z.array(z.object({ placeId: z.string().max(100) })).max(15) })).min(1).max(7) }),
});

planRouter.post(
  "/plan/revise",
  asyncHandler(async (req, res) => {
    const { prefs, message, plan } = reviseBody.parse(req.body);
    const loaded = await load(req.user!.id);
    const all = loaded.all;
    const cart = prefs.autoPick ? [] : loaded.cart;
    let draft;
    try {
      draft = await reviseWithAi(prefs, cart, all, plan.days, message);
    } catch (e) {
      if (e instanceof HttpError && e.status === 503) throw e;
      throw new HttpError(502, "Trợ lý chưa chỉnh được lịch, bạn thử nói lại hoặc dùng \"Sửa tay\" nhé");
    }
    res.json(await withPlaces(buildPlan(prefs, cart, all, draft)));
  }),
);
