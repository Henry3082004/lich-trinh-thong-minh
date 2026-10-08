import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import { asyncHandler } from "../lib/http";
import { rateLimit } from "../lib/rate-limit";
import { requireUser } from "../middleware/auth";
import { chat } from "../services/chat";

export const chatRouter = Router();

// App dùng để biết có hiện nút chatbot hay không
chatRouter.get("/chat/status", (_req, res) => {
  res.json({ enabled: Boolean(config.geminiApiKey) });
});

const body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().trim().min(1).max(500) }))
    .min(1)
    .max(12),
});

// Cần đăng nhập và giới hạn số câu hỏi mỗi giờ để không bị lạm dụng hạn mức Gemini
chatRouter.post(
  "/chat",
  requireUser,
  rateLimit({ windowMs: 60 * 60 * 1000, max: config.chatPerHour, key: (req) => req.user?.id ?? req.ip ?? "?" }),
  asyncHandler(async (req, res) => {
    const { messages } = body.parse(req.body);
    // Gemini yêu cầu lượt cuối là của khách
    if (messages[messages.length - 1].role !== "user") {
      res.status(400).json({ error: "Tin nhắn cuối phải là của người dùng" });
      return;
    }
    res.json(await chat(messages));
  }),
);
