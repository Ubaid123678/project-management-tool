import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { broadcastToProject } from "../realtime/socket.js";

const router = Router();

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

const invitationSchema = z.object({
  email: z.string().email()
});

const roleSchema = z.object({
  role: z.enum(["owner", "admin", "member"])
});

const boardSchema = z.object({
  name: z.string().min(2)
});

const ensureMember = async (projectId: string, userId: string) => {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } }
  });
};

router.get("/", requireAuth, async (req, res) => {
  const projects = await prisma.project.findMany({
    where: {
      members: { some: { userId: req.user?.userId } },
      deletedAt: null
    },
    orderBy: { updatedAt: "desc" }
  });

  return res.json({ projects });
});

router.post("/", requireAuth, async (req, res) => {
  const data = projectSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const project = await prisma.project.create({
    data: {
      name: data.data.name,
      description: data.data.description,
      ownerId: req.user?.userId ?? "",
      members: {
        create: {
          userId: req.user?.userId ?? "",
          role: "owner"
        }
      },
      boards: {
        create: {
          name: "Default Board",
          columns: {
            create: [
              { name: "To Do", position: 0 },
              { name: "In Progress", position: 1 },
              { name: "Done", position: 2 }
            ]
          }
        }
      }
    },
    include: {
      boards: {
        include: {
          columns: true
        }
      }
    }
  });

  return res.status(201).json({ project });
});

router.post("/:projectId/boards", requireAuth, async (req, res) => {
  const data = boardSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { projectId } = req.params;
  const member = await ensureMember(projectId, req.user?.userId ?? "");

  if (!member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const board = await prisma.board.create({
    data: {
      projectId,
      name: data.data.name,
      columns: {
        create: [
          { name: "To Do", position: 0 },
          { name: "In Progress", position: 1 },
          { name: "Done", position: 2 }
        ]
      }
    },
    include: { columns: true }
  });

  return res.status(201).json({ board });
});

router.get("/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const member = await ensureMember(projectId, req.user?.userId ?? "");
  if (!member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      boards: {
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
      },
      members: {
        include: {
          user: true
        }
      }
    }
  });

  if (!project || project.deletedAt) {
    return res.status(404).json({ code: "not_found", message: "Project not found" });
  }

  return res.json({ project });
});

router.patch("/:projectId", requireAuth, async (req, res) => {
  const data = projectSchema.partial().safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { projectId } = req.params;
  const member = await ensureMember(projectId, req.user?.userId ?? "");
  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: data.data
  });

  return res.json({ project });
});

router.delete("/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const member = await ensureMember(projectId, req.user?.userId ?? "");
  if (!member || member.role !== "owner") {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const members = await prisma.projectMember.findMany({ where: { projectId } });
  await Promise.all(
    members.map((projectMember) =>
      prisma.notification.create({
        data: {
          recipientId: projectMember.userId,
          type: "project_deleted",
          title: "Project deleted",
          body: "A project you were part of was deleted.",
          data: { projectId }
        }
      })
    )
  );

  await prisma.project.delete({ where: { id: projectId } });
  broadcastToProject(projectId, "project:deleted", { projectId });

  return res.json({ status: "ok" });
});

router.get("/invitations/pending", requireAuth, async (req, res) => {
  const invitations = await prisma.invitation.findMany({
    where: {
      email: (await prisma.user.findUnique({ where: { id: req.user?.userId } }))?.email ?? "",
      status: "pending"
    },
    include: {
      project: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ invitations });
});

router.post("/:projectId/invitations", requireAuth, async (req, res) => {
  const data = invitationSchema.safeParse(req.body);
  if (!data.success) {
    return res.status(400).json({ code: "invalid_input", message: "Invalid input" });
  }

  const { projectId } = req.params;
  const member = await ensureMember(projectId, req.user?.userId ?? "");
  if (!member || member.role !== "owner") {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const invitation = await prisma.invitation.create({
    data: {
      projectId,
      email: data.data.email,
      invitedBy: req.user?.userId ?? "",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.notification.create({
    data: {
      recipientId: req.user?.userId ?? "",
      type: "project_invite",
      title: "Project invitation created",
      body: `Invitation sent to ${data.data.email}`,
      data: { projectId }
    }
  });

  return res.status(201).json({ invitation });
});

router.post("/invitations/:invitationId/accept", requireAuth, async (req, res) => {
  const { invitationId } = req.params;
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId }
  });

  if (!invitation || invitation.status !== "pending") {
    return res.status(404).json({ code: "not_found", message: "Invite not found" });
  }

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: invitation.projectId,
        userId: req.user?.userId ?? ""
      }
    },
    update: {},
    create: {
      projectId: invitation.projectId,
      userId: req.user?.userId ?? "",
      role: "member"
    }
  });

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "accepted" }
  });

  broadcastToProject(invitation.projectId, "member:joined", {
    projectId: invitation.projectId,
    userId: req.user?.userId
  });

  return res.json({ status: "ok" });
});

router.delete("/:projectId/members/:memberId", requireAuth, async (req, res) => {
  const { projectId, memberId } = req.params;
  const member = await ensureMember(projectId, req.user?.userId ?? "");
  if (!member || member.role !== "owner") {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: memberId } }
  });

  broadcastToProject(projectId, "member:left", { projectId, userId: memberId });

  return res.json({ status: "ok" });
});

router.patch(
  "/:projectId/members/:memberId/role",
  requireAuth,
  async (req, res) => {
    const data = roleSchema.safeParse(req.body);
    if (!data.success) {
      return res
        .status(400)
        .json({ code: "invalid_input", message: "Invalid input" });
    }

    const { projectId, memberId } = req.params;
    const member = await ensureMember(projectId, req.user?.userId ?? "");
    if (!member || member.role !== "owner") {
      return res.status(403).json({ code: "forbidden", message: "Access denied" });
    }

    await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: memberId } },
      data: { role: data.data.role }
    });

    return res.json({ status: "ok" });
  }
);

router.get("/:projectId/tasks/search", requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const member = await ensureMember(projectId, req.user?.userId ?? "");
  if (!member) {
    return res.status(403).json({ code: "forbidden", message: "Access denied" });
  }

  const query = (req.query.q as string | undefined)?.trim();
  if (!query) {
    return res.status(400).json({ code: "invalid_input", message: "Query required" });
  }

  const assigneeId = req.query.assigneeId as string | undefined;
  const columnId = req.query.columnId as string | undefined;
  const dueBefore = req.query.dueBefore as string | undefined;
  const dueAfter = req.query.dueAfter as string | undefined;

  const tasks = await prisma.task.findMany({
    where: {
      board: { projectId },
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } }
      ],
      ...(columnId ? { columnId } : {}),
      ...(assigneeId
        ? { assignees: { some: { userId: assigneeId } } }
        : {}),
      ...(dueBefore || dueAfter
        ? {
            dueDate: {
              ...(dueBefore ? { lte: new Date(dueBefore) } : {}),
              ...(dueAfter ? { gte: new Date(dueAfter) } : {})
            }
          }
        : {})
    },
    include: {
      assignees: true
    },
    orderBy: { updatedAt: "desc" }
  });

  return res.json({ tasks });
});

export default router;
