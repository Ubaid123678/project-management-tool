import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toPublicUser } from "../utils/users.js";

const router = Router();

const profileSchema = z.object({
  displayName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.userId }
  });

  if (!user) {
    return res.status(404).json({ code: "not_found", message: "User not found" });
  }

  return res.json({ user: toPublicUser(user) });
});

router.patch("/me", requireAuth, async (req, res) => {
  const data = profileSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const user = await prisma.user.update({
    where: { id: req.user?.userId },
    data: data.data
  });

  return res.json({ user: toPublicUser(user) });
});

router.patch("/me/password", requireAuth, async (req, res) => {
  const data = passwordSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user?.userId }
  });

  if (!user) {
    return res.status(404).json({ code: "not_found", message: "User not found" });
  }

  const valid = await verifyPassword(data.data.currentPassword, user.passwordHash);
  if (!valid) {
    return res
      .status(401)
      .json({ code: "invalid_credentials", message: "Invalid credentials" });
  }

  const passwordHash = await hashPassword(data.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  return res.json({ status: "ok" });
});

export default router;
