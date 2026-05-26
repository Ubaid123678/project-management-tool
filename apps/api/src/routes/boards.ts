import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { broadcastToProject } from "../realtime/socket.js";

const router = Router();

const boardSchema = z.object({
  name: z.string().min(2)
});

const reorderSchema = z.object({
  columnOrder: z.array(z.string().min(1))
});

const columnSchema = z.object({
  name: z.string().min(1),
  position: z.number().int().nonnegative().optional()
});

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional()
});

const ensureMemberByBoard = async (boardId: string, userId: string) => {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return { board: null, member: null };
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: board.projectId, userId } }
  });

  return { board, member };
};

router.get("/:boardId", requireAuth, async (req, res) => {
  const { boardId } = req.params;
  const { board, member } = await ensureMemberByBoard(
    boardId,
    req.user?.userId ?? ""
  );

  if (!board || !member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const fullBoard = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        include: {
          tasks: {
            include: {
              assignees: true,
              comments: true
            },
            orderBy: { position: "asc" }
          }
        },
        orderBy: { position: "asc" }
      }
    }
  });

  return res.json({ board: fullBoard });
});

router.post("/:boardId/columns", requireAuth, async (req, res) => {
  const data = columnSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { boardId } = req.params;
  const { board, member } = await ensureMemberByBoard(
    boardId,
    req.user?.userId ?? ""
  );

  if (!board || !member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const position =
    data.data.position ??
    (await prisma.column.count({ where: { boardId } }));

  const column = await prisma.column.create({
    data: {
      boardId,
      name: data.data.name,
      position
    }
  });

  return res.status(201).json({ column });
});

router.post(
  "/:boardId/columns/:columnId/tasks",
  requireAuth,
  async (req, res) => {
    const data = taskSchema.safeParse(req.body);
    if (!data.success) {
      return res
        .status(400)
        .json({ code: "invalid_input", message: "Invalid input" });
    }

    const { boardId, columnId } = req.params;
    const { board, member } = await ensureMemberByBoard(
      boardId,
      req.user?.userId ?? ""
    );

    if (!board || !member) {
      return res.status(403).json({ code: "forbidden", message: "Access denied" });
    }

    const column = await prisma.column.findUnique({ where: { id: columnId } });
    if (!column || column.boardId !== boardId) {
      return res.status(404).json({ code: "not_found", message: "Column not found" });
    }

    const position = await prisma.task.count({ where: { columnId } });

    const task = await prisma.task.create({
      data: {
        boardId,
        columnId,
        position,
        title: data.data.title,
        description: data.data.description,
        dueDate: data.data.dueDate ? new Date(data.data.dueDate) : undefined,
        priority: data.data.priority ?? "medium",
        creatorId: req.user?.userId ?? ""
      }
    });

    broadcastToProject(board.projectId, "task:created", { task });

    return res.status(201).json({ task });
  }
);

router.patch("/:boardId", requireAuth, async (req, res) => {
  const data = boardSchema.partial().safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { boardId } = req.params;
  const { board, member } = await ensureMemberByBoard(
    boardId,
    req.user?.userId ?? ""
  );

  if (!board || !member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: data.data
  });

  return res.json({ board: updated });
});

router.delete("/:boardId", requireAuth, async (req, res) => {
  const { boardId } = req.params;
  const { board, member } = await ensureMemberByBoard(
    boardId,
    req.user?.userId ?? ""
  );

  if (!board || !member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  await prisma.board.delete({ where: { id: boardId } });
  return res.json({ status: "ok" });
});

router.patch("/:boardId/columns/reorder", requireAuth, async (req, res) => {
  const data = reorderSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { boardId } = req.params;
  const { board, member } = await ensureMemberByBoard(
    boardId,
    req.user?.userId ?? ""
  );

  if (!board || !member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  await Promise.all(
    data.data.columnOrder.map((columnId, index) =>
      prisma.column.update({
        where: { id: columnId },
        data: { position: index }
      })
    )
  );

  return res.json({ status: "ok" });
});

export default router;
