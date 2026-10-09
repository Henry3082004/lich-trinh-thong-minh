import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { User } from "@prisma/client";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

type ZaloProfile = { id: string; name?: string; avatar?: string };

// Cache token → profile để không gọi Zalo ở mọi request
const CACHE_TTL_MS = 5 * 60 * 1000;
const tokenCache = new Map<string, { profile: ZaloProfile; expiresAt: number }>();

async function fetchZaloProfile(accessToken: string): Promise<ZaloProfile> {
  const cached = tokenCache.get(accessToken);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;

  const headers: Record<string, string> = { access_token: accessToken };
  // appsecret_proof là tuỳ chọn, chỉ gửi khi đã cấu hình secret key của app
  const secret = process.env.ZALO_APP_SECRET;
  if (secret) {
    headers.appsecret_proof = crypto.createHmac("sha256", secret).update(accessToken).digest("hex");
  }

  const res = await fetch(`${config.zaloGraphUrl}?fields=id,name,picture`, { headers });
  const body = (await res.json().catch(() => null)) as
    | { id?: string; name?: string; picture?: { data?: { url?: string } }; error?: number; message?: string }
    | null;

  if (!res.ok || !body || (body.error && body.error !== 0) || !body.id) {
    throw new HttpError(401, "Token Zalo không hợp lệ hoặc đã hết hạn");
  }

  const profile = { id: body.id, name: body.name, avatar: body.picture?.data?.url };
  tokenCache.set(accessToken, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
  return profile;
}

async function resolveProfile(req: Request): Promise<ZaloProfile> {
  const devUser = config.authMode === "dev" ? req.header("x-dev-user") : undefined;
  const auth = req.header("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : undefined;

  if (devUser) {
    // Chế độ dev/demo: có thẻ Zalo thì kiểm tra thật, thẻ lỗi hoặc Zalo không trả lời thì dùng mã khách theo máy.
    // Không có thẻ (trình duyệt thường) thì dùng mã khách luôn.
    if (token) {
      try {
        return await fetchZaloProfile(token);
      } catch {
        // rơi xuống mã khách bên dưới
      }
    }
    return { id: `dev:${devUser}`, name: devUser };
  }

  if (!token) throw new HttpError(401, "Thiếu access token");
  return fetchZaloProfile(token);
}

export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const profile = await resolveProfile(req);
    req.user = await prisma.user.upsert({
      where: { zaloId: profile.id },
      create: { zaloId: profile.id, name: profile.name, avatar: profile.avatar },
      update: { name: profile.name, avatar: profile.avatar },
    });
    next();
  } catch (err) {
    next(err);
  }
}
