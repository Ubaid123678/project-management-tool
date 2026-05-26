import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev_refresh",
  tokenExpiresIn: process.env.TOKEN_EXPIRES_IN ?? "15m",
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  uploadMaxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB ?? 10)
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export default env;
