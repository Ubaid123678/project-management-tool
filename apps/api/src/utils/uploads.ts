import path from "path";
import fs from "fs";
import multer from "multer";
import env from "../config/env.js";

const ensureUploadDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
ensureUploadDir(uploadRoot);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    cb(null, `${unique}_${safeName}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: env.uploadMaxSizeMb * 1024 * 1024 }
});

export const getUploadPath = (storageKey: string) =>
  path.join(uploadRoot, storageKey);

export const getUploadUrl = (storageKey: string) => `/uploads/${storageKey}`;
