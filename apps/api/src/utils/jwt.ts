import jwt from "jsonwebtoken";
import env from "../config/env.js";

export type TokenPayload = { userId: string; sessionId: string };

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.tokenExpiresIn });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshExpiresIn });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtSecret) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
