import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { HttpError } from "../src/lib/http";
import { rateLimit } from "../src/lib/rate-limit";

const req = (ip: string) => ({ ip }) as unknown as Request;
const call = (limiter: ReturnType<typeof rateLimit>, ip: string) => {
  let result: unknown = "chưa gọi";
  limiter(req(ip), {} as never, (err?: unknown) => (result = err));
  return result;
};

afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("cho phép tới giới hạn rồi trả 429, tính riêng từng khoá", () => {
    const limiter = rateLimit({ windowMs: 1000, max: 2, key: (r) => r.ip as string });
    expect(call(limiter, "a")).toBeUndefined();
    expect(call(limiter, "a")).toBeUndefined();
    const blocked = call(limiter, "a");
    expect(blocked).toBeInstanceOf(HttpError);
    expect((blocked as HttpError).status).toBe(429);
    expect(call(limiter, "b")).toBeUndefined(); // người khác không bị ảnh hưởng
  });

  it("hết cửa sổ thời gian thì được dùng lại", () => {
    vi.useFakeTimers();
    const limiter = rateLimit({ windowMs: 1000, max: 1, key: (r) => r.ip as string });
    expect(call(limiter, "a")).toBeUndefined();
    expect(call(limiter, "a")).toBeInstanceOf(HttpError);
    vi.advanceTimersByTime(1001);
    expect(call(limiter, "a")).toBeUndefined();
  });
});
