import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { broadcastToProject } from "../realtime/socket.js";

const router = Router();

const commentSchema = z.object({
  content: z.string().min(1)
});

const ensureMemberByComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return { comment: null, member: null, projectId: null };
  }

  const task = await prisma.task.findUnique({ where: { id: comment.taskId } });
  if (!task) {
    return { comment, member: null, projectId: null };
  }

  const board = await prisma.board.findUnique({ where: { id: task.boardId } });
  if (!board) {
    return { comment, member: null, projectId: null };
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: board.projectId, userId } }
  });

  return { comment, member, projectId: board.projectId };
};

router.patch("/:commentId", requireAuth, async (req, res) => {
  const data = commentSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { commentId } = req.params;
  const { comment, member, projectId } = await ensureMemberByComment(
    commentId,
    req.user?.userId ?? ""
  );

  if (!comment || !member || !projectId) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  if (comment.authorId !== req.user?.userId) {
    return res.status(403).json({ code: "forbidden", message: "Only author can edit" });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: data.data.content, updatedAt: new Date() }
  });

  broadcastToProject(projectId, "comment:updated", { comment: updated });
  return res.json({ comment: updated });
});

router.delete("/:commentId", requireAuth, async (req, res) => {
  const { commentId } = req.params;
  const { comment, member, projectId } = await ensureMemberByComment(
    commentId,
    req.user?.userId ?? ""
  );

  if (!comment || !member || !projectId) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  if (comment.authorId !== req.user?.userId) {
    return res.status(403).json({ code: "forbidden", message: "Only author can delete" });
  }

  const mentions = await prisma.mention.findMany({ where: { commentId } });
  await Promise.all(
    mentions.map((mention) =>
      prisma.notification.create({
        data: {
          recipientId: mention.userId,
          type: "task_mention",
          title: "Mention removed",
          body: "A comment that mentioned you was deleted.",
          data: { commentId }
        }
      })
    )
  );

  await prisma.comment.delete({ where: { id: commentId } });
  broadcastToProject(projectId, "comment:deleted", { commentId });
  return res.json({ status: "ok" });
});

export default router;
