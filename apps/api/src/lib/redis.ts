import { Redis } from "ioredis";
import env from "../config/env.js";

const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 20,
  retryStrategy: (times) => Math.min(times * 100, 3000)
});

redis.connect().catch(() => {});
redis.on("error", () => {});

export default redis;

const SESSION_TTL = 7 * 24 * 60 * 60;

type SessionData = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: string;
};

export const cacheSession = async (sessionId: string, data: SessionData) => {
  try {
    await redis.setex(`session:${sessionId}`, SESSION_TTL, JSON.stringify(data));
  } catch {}
};

export const getCachedSession = async (sessionId: string): Promise<SessionData | null> => {
  try {
    const raw = await redis.get(`session:${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
};

export const deleteCachedSession = async (sessionId: string) => {
  try {
    await redis.del(`session:${sessionId}`);
  } catch {}
};
