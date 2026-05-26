import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import projectRoutes from "./projects.js";
import boardRoutes from "./boards.js";
import columnRoutes from "./columns.js";
import taskRoutes from "./tasks.js";
import commentRoutes from "./comments.js";
import notificationRoutes from "./notifications.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/boards", boardRoutes);
router.use("/columns", columnRoutes);
router.use("/tasks", taskRoutes);
router.use("/comments", commentRoutes);
router.use("/notifications", notificationRoutes);

export default router;
