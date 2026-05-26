import jwt, { type SignOptions } from "jsonwebtoken";
import env from "../config/env.js";

export type TokenPayload = { userId: string; sessionId: string };

const signOpts = (expiresIn: string): SignOptions => ({ expiresIn: expiresIn as never });

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtSecret, signOpts(env.tokenExpiresIn));

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtRefreshSecret, signOpts(env.refreshExpiresIn));

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtSecret) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
