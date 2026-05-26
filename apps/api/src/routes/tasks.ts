import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { broadcastToProject } from "../realtime/socket.js";
import { parseMentions } from "../utils/mentions.js";

const router = Router();

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional()
});

const moveSchema = z.object({
  targetColumnId: z.string().min(1),
  targetPosition: z.number().int().nonnegative()
});

const assigneesSchema = z.object({
  assigneeIds: z.array(z.string().min(1))
});

const commentSchema = z.object({
  content: z.string().min(1)
});

const ensureMemberByTask = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return { task: null, member: null, projectId: null };
  }

  const board = await prisma.board.findUnique({ where: { id: task.boardId } });
  if (!board) {
    return { task, member: null, projectId: null }; 
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: board.projectId, userId } }
  });

  return { task, member, projectId: board.projectId };
};

router.get("/:taskId", requireAuth, async (req, res) => {
  const { taskId } = req.params;
  const { task, member } = await ensureMemberByTask(
    taskId,
    req.user?.userId ?? ""
  );

  if (!task || !member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const fullTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: true,
      comments: true
    }
  });

  return res.json({ task: fullTask });
});

router.patch("/:taskId", requireAuth, async (req, res) => {
  const data = updateSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { taskId } = req.params;
  const { task, member, projectId } = await ensureMemberByTask(
    taskId,
    req.user?.userId ?? ""
  );

  if (!task || !member || !projectId) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data.data,
      dueDate: data.data.dueDate ? new Date(data.data.dueDate) : data.data.dueDate
    }
  });

  broadcastToProject(projectId, "task:updated", { task: updated });
  return res.json({ task: updated });
});

router.patch("/:taskId/move", requireAuth, async (req, res) => {
  const data = moveSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { taskId } = req.params;
  const { task, member, projectId } = await ensureMemberByTask(
    taskId,
    req.user?.userId ?? ""
  );

  if (!task || !member || !projectId) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      columnId: data.data.targetColumnId,
      position: data.data.targetPosition
    }
  });

  broadcastToProject(projectId, "task:moved", {
    taskId,
    columnId: data.data.targetColumnId,
    position: data.data.targetPosition
  });

  return res.json({ task: updated });
});

router.patch("/:taskId/assignees", requireAuth, async (req, res) => {
  const data = assigneesSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { taskId } = req.params;
  const { task, member, projectId } = await ensureMemberByTask(
    taskId,
    req.user?.userId ?? ""
  );

  if (!task || !member || !projectId) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const existing = await prisma.taskAssignee.findMany({ where: { taskId } });
  const previousIds = new Set(existing.map((assignee) => assignee.userId));
  const nextIds = new Set(data.data.assigneeIds);

  await prisma.taskAssignee.deleteMany({ where: { taskId } });
  await prisma.taskAssignee.createMany({
    data: data.data.assigneeIds.map((userId) => ({ taskId, userId }))
  });

  const added = data.data.assigneeIds.filter((id) => !previousIds.has(id));
  const removed = [...previousIds].filter((id) => !nextIds.has(id));

  await Promise.all(
    added.map((recipientId) =>
      prisma.notification.create({
        data: {
          recipientId,
          type: "task_assigned",
          title: "Task assigned",
          body: task.title,
          data: { taskId }
        }
      })
    )
  );

  await Promise.all(
    removed.map((recipientId) =>
      prisma.notification.create({
        data: {
          recipientId,
          type: "task_reassigned",
          title: "Task unassigned",
          body: task.title,
          data: { taskId }
        }
      })
    )
  );

  broadcastToProject(projectId, "task:updated", { taskId });
  return res.json({ status: "ok" });
});

router.delete("/:taskId", requireAuth, async (req, res) => {
  const { taskId } = req.params;
  const { task, member, projectId } = await ensureMemberByTask(
    taskId,
    req.user?.userId ?? ""
  );

  if (!task || !member || !projectId) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const assignees = await prisma.taskAssignee.findMany({ where: { taskId } });
  await Promise.all(
    assignees.map((assignee) =>
      prisma.notification.create({
        data: {
          recipientId: assignee.userId,
          type: "task_deleted",
          title: "Task deleted",
          body: task.title,
          data: { taskId }
        }
      })
    )
  );

  await prisma.task.delete({ where: { id: taskId } });

  broadcastToProject(projectId, "task:deleted", { taskId });
  return res.json({ status: "ok" });
});

router.post("/:taskId/comments", requireAuth, async (req, res) => {
  const data = commentSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { taskId } = req.params;
  const { task, member, projectId } = await ensureMemberByTask(
    taskId,
    req.user?.userId ?? ""
  );

  if (!task || !member || !projectId) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const mentionMatches = parseMentions(data.data.content);
  const mentionUsernames = mentionMatches.map((mention) => mention.username);
  const mentionedUsers = await prisma.user.findMany({
    where: { username: { in: mentionUsernames } }
  });

  const mentionEntries = mentionMatches
    .map((mention) => {
      const user = mentionedUsers.find(
        (candidate) => candidate.username === mention.username
      );
      if (!user) {
        return null;
      }
      return {
        userId: user.id,
        positionStart: mention.start,
        positionEnd: mention.end
      };
    })
    .filter((entry) => entry !== null) as {
    userId: string;
    positionStart: number;
    positionEnd: number;
  }[];

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: req.user?.userId ?? "",
      content: data.data.content,
      mentions: {
        create: mentionEntries
      }
    }
  });

  const assignees = await prisma.taskAssignee.findMany({ where: { taskId } });
  const notifyIds = new Set([
    ...assignees.map((assignee) => assignee.userId),
    ...mentionEntries.map((entry) => entry.userId)
  ]);
  notifyIds.delete(req.user?.userId ?? "");

  await Promise.all(
    [...notifyIds].map((recipientId) =>
      prisma.notification.create({
        data: {
          recipientId,
          type: mentionEntries.some((entry) => entry.userId === recipientId)
            ? "task_mention"
            : "task_comment",
          title: "New comment",
          body: data.data.content.slice(0, 120),
          data: { taskId }
        }
      })
    )
  );

  broadcastToProject(projectId, "comment:created", { comment });
  return res.status(201).json({ comment });
});

router.post("/:taskId/attachments", requireAuth, async (_req, res) => {
  return res.status(501).json({
    code: "not_implemented",
    message: "Attachments are not implemented in v1"
  });
});

router.delete("/:taskId/attachments/:attachmentId", requireAuth, async (_req, res) => {
  return res.status(501).json({
    code: "not_implemented",
    message: "Attachments are not implemented in v1"
  });
});

export default router;
