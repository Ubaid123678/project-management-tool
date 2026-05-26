import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const columnSchema = z.object({
  name: z.string().min(1),
  position: z.number().int().nonnegative().optional()
});

const ensureMemberByColumn = async (columnId: string, userId: string) => {
  const column = await prisma.column.findUnique({ where: { id: columnId } });
  if (!column) {
    return { column: null, member: null };
  }

  const board = await prisma.board.findUnique({ where: { id: column.boardId } });
  if (!board) {
    return { column, member: null };
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: board.projectId, userId } }
  });

  return { column, member };
};

router.patch("/:columnId", requireAuth, async (req, res) => {
  const data = columnSchema.partial().safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { columnId } = req.params;
  const { column, member } = await ensureMemberByColumn(
    columnId,
    req.user?.userId ?? ""
  );

  if (!column || !member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const updated = await prisma.column.update({
    where: { id: columnId },
    data: data.data
  });

  return res.json({ column: updated });
});

router.delete("/:columnId", requireAuth, async (req, res) => {
  const { columnId } = req.params;
  const { column, member } = await ensureMemberByColumn(
    columnId,
    req.user?.userId ?? ""
  );

  if (!column || !member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  await prisma.column.delete({ where: { id: columnId } });
  return res.json({ status: "ok" });
});

export default router;
