import { Redis } from "ioredis";
import env from "../config/env.js";

const redis = new Redis(env.redisUrl);

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redis;

const SESSION_TTL = 7 * 24 * 60 * 60;

type SessionData = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: string;
};

export const cacheSession = async (sessionId: string, data: SessionData) => {
  await redis.setex(`session:${sessionId}`, SESSION_TTL, JSON.stringify(data));
};

export const getCachedSession = async (sessionId: string): Promise<SessionData | null> => {
  const raw = await redis.get(`session:${sessionId}`);
  if (!raw) return null;
  return JSON.parse(raw) as SessionData;
};

export const deleteCachedSession = async (sessionId: string) => {
  await redis.del(`session:${sessionId}`);
};
