import { Router, type Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import prisma from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import { hashToken } from "../utils/tokens.js";
import env from "../config/env.js";
import { durationToMs } from "../utils/duration.js";
import { toPublicUser } from "../utils/users.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/api/auth/refresh"
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
};

const generateUsername = async (email: string) => {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || "user";
  let candidate = base;
  let suffix = 0;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }

  return candidate;
};

const createSession = async (userId: string) => {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ userId, sessionId });
  const refreshTokenHash = hashToken(refreshToken);
  const refreshMs = durationToMs(env.refreshExpiresIn, 7 * 24 * 60 * 60 * 1000);
  const expiresAt = new Date(Date.now() + refreshMs);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      refreshTokenHash,
      expiresAt
    }
  });

  return { sessionId, refreshToken };
};

router.post("/register", async (req, res) => {
  const data = registerSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { email, password, displayName } = data.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res
      .status(409)
      .json({ code: "email_exists", message: "Email already registered" });
  }

  const username = await generateUsername(email);
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      displayName,
      passwordHash,
      notificationPreferences: {
        create: {}
      }
    }
  });

  const { sessionId, refreshToken } = await createSession(user.id);
  const accessToken = signAccessToken({ userId: user.id, sessionId });

  setRefreshCookie(res, refreshToken);

  return res.status(201).json({
    user: toPublicUser(user),
    accessToken
  });
});

router.post("/login", async (req, res) => {
  const data = loginSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { email, password } = data.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res
      .status(401)
      .json({ code: "invalid_credentials", message: "Invalid credentials" });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return res
      .status(401)
      .json({ code: "invalid_credentials", message: "Invalid credentials" });
  }

  const { sessionId, refreshToken } = await createSession(user.id);
  const accessToken = signAccessToken({ userId: user.id, sessionId });

  setRefreshCookie(res, refreshToken);

  return res.json({
    user: toPublicUser(user),
    accessToken
  });
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refresh_token as string | undefined;
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.session.delete({ where: { id: payload.sessionId } });
    } catch (error) {
      // Ignore invalid refresh tokens to allow logout to succeed.
    }
  }

  clearRefreshCookie(res);
  return res.json({ status: "ok" });
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refresh_token as string | undefined;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ code: "unauthorized", message: "Missing refresh token" });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const existing = await prisma.session.findUnique({
      where: { id: payload.sessionId }
    });

    if (!existing || existing.refreshTokenHash !== hashToken(refreshToken)) {
      return res
        .status(401)
        .json({ code: "unauthorized", message: "Invalid refresh token" });
    }

    await prisma.session.delete({ where: { id: payload.sessionId } });

    const { sessionId, refreshToken: nextRefresh } = await createSession(
      payload.userId
    );
    const accessToken = signAccessToken({
      userId: payload.userId,
      sessionId
    });

    setRefreshCookie(res, nextRefresh);
    return res.json({ accessToken });
  } catch (error) {
    return res
      .status(401)
      .json({ code: "unauthorized", message: "Invalid refresh token" });
  }
});

export default router;
