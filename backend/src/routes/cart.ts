import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError } from "../lib/http";
import { prisma } from "../lib/prisma";
import { requireUser } from "../middleware/auth";

export const cartRouter = Router();
export const CART_MAX_ITEMS = 40;

// Giỏ lịch trình của khách: các điểm / món / lễ hội đã bấm "Thêm vào lịch trình"
cartRouter.use("/cart", requireUser);

async function listCart(userId: string) {
  const rows = await prisma.cartItem.findMany({ where: { userId }, include: { place: true }, orderBy: { addedAt: "asc" } });
  return rows.map((r) => r.place);
}

cartRouter.get(
  "/cart",
  asyncHandler(async (req, res) => {
    res.json(await listCart(req.user!.id));
  }),
);

const addBody = z.object({ placeId: z.string().min(1).max(100) });

// Thêm lặp lại cùng một mục không báo lỗi (khách bấm hai lần)
cartRouter.post(
  "/cart",
  asyncHandler(async (req, res) => {
    const { placeId } = addBody.parse(req.body);
    const userId = req.user!.id;
    const place = await prisma.place.findFirst({ where: { OR: [{ id: placeId }, { slug: placeId }] } });
    if (!place) throw new HttpError(404, "Không tìm thấy điểm đến");
    const existing = await prisma.cartItem.findUnique({ where: { userId_placeId: { userId, placeId: place.id } } });
    if (!existing) {
      if ((await prisma.cartItem.count({ where: { userId } })) >= CART_MAX_ITEMS) {
        throw new HttpError(409, `Giỏ lịch trình tối đa ${CART_MAX_ITEMS} mục`);
      }
      await prisma.cartItem.create({ data: { userId, placeId: place.id } });
    }
    res.status(existing ? 200 : 201).json(await listCart(userId));
  }),
);

cartRouter.delete(
  "/cart/:placeId",
  asyncHandler(async (req, res) => {
    await prisma.cartItem.deleteMany({ where: { userId: req.user!.id, placeId: req.params.placeId } });
    res.json(await listCart(req.user!.id));
  }),
);

cartRouter.delete(
  "/cart",
  asyncHandler(async (req, res) => {
    await prisma.cartItem.deleteMany({ where: { userId: req.user!.id } });
    res.json([]);
  }),
);
