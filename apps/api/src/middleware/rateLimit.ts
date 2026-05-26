import type { Request, Response, NextFunction } from "express";
import redis from "../lib/redis.js";

export const rateLimit = (windowMs: number, max: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${req.ip}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }
      if (current > max) {
        return res.status(429).json({ code: "rate_limited", message: "Too many requests" });
      }
      next();
    } catch {
      next();
    }
  };
};
