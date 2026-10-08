import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./http";

// Giới hạn số lần gọi theo cửa sổ thời gian cố định, lưu trong bộ nhớ (đủ cho 1 máy chủ).
// key: hàm lấy khoá (ví dụ id người dùng hoặc địa chỉ IP).
export function rateLimit(options: { windowMs: number; max: number; key: (req: Request) => string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = options.key(req);
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + options.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    // Dọn các khoá đã hết hạn để Map không phình mãi
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }

    if (entry.count > options.max) {
      next(new HttpError(429, "Bạn thao tác quá nhanh, vui lòng thử lại sau"));
      return;
    }
    next();
  };
}
