import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import env from "../config/env.js";

let io: Server | null = null;

export const initSocket = (httpServer: Parameters<Server["attach"]>[0]) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true
    }
  });

  const pubClient = new Redis(env.redisUrl);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    socket.on("project:join", ({ projectId }) => {
      socket.join(`project:${projectId}`);
    });

    socket.on("project:leave", ({ projectId }) => {
      socket.leave(`project:${projectId}`);
    });
  });

  return io;
};

export const broadcastToProject = (
  projectId: string,
  event: string,
  payload: unknown
) => {
  if (!io) {
    return;
  }

  io.to(`project:${projectId}`).emit(event, payload);
};
