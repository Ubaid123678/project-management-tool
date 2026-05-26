import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const preferencesSchema = z.object({
  taskAssigned: z.boolean().optional(),
  taskReassigned: z.boolean().optional(),
  taskMention: z.boolean().optional(),
  taskComment: z.boolean().optional(),
  taskDeleted: z.boolean().optional(),
  projectDeleted: z.boolean().optional(),
  projectInvite: z.boolean().optional(),
  memberRemoved: z.boolean().optional()
});

router.get("/", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: req.user?.userId ?? "" },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ notifications });
});

router.patch("/:notificationId/read", requireAuth, async (req, res) => {
  const { notificationId } = req.params;
  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() }
  });

  return res.json({ status: "ok" });
});

router.patch("/read-all", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { recipientId: req.user?.userId ?? "", readAt: null },
    data: { readAt: new Date() }
  });

  return res.json({ status: "ok" });
});

router.get("/preferences", requireAuth, async (req, res) => {
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId: req.user?.userId ?? "" }
  });

  return res.json({ preferences });
});

router.patch("/preferences", requireAuth, async (req, res) => {
  const data = preferencesSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: req.user?.userId ?? "" },
    update: data.data,
    create: { userId: req.user?.userId ?? "", ...data.data }
  });

  return res.json({ preferences });
});

export default router;
