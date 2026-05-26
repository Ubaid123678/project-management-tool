import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { apiJson } from "../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
};

type Column = {
  id: string;
  name: string;
  tasks: Task[];
};

type Board = {
  id: string;
  name: string;
  columns: Column[];
};

type Project = {
  id: string;
  name: string;
  boards: Board[];
};

type ProjectResponse = {
  project: Project;
};

const ProjectBoard = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiJson<ProjectResponse>(`/api/projects/${projectId}`),
    enabled: Boolean(projectId)
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const socket = io(API_URL, { withCredentials: true });
    socket.emit("project:join", { projectId });

    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });

    socket.on("task:created", refresh);
    socket.on("task:updated", refresh);
    socket.on("task:moved", refresh);
    socket.on("task:deleted", refresh);
    socket.on("comment:created", refresh);

    return () => {
      socket.emit("project:leave", { projectId });
      socket.disconnect();
    };
  }, [projectId, queryClient]);

  const board = data?.project.boards?.[0];

  const createTask = async (columnId: string) => {
    if (!board) {
      return;
    }

    const title = drafts[columnId];
    if (!title) {
      return;
    }

    await apiJson(`/api/boards/${board.id}/columns/${columnId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title })
    });

    setDrafts((prev) => ({ ...prev, [columnId]: "" }));
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="card">
        <h3>{data?.project.name ?? "Project"}</h3>
        <p className="badge">Realtime board sync is enabled</p>
      </section>
      <section className="board">
        {(board?.columns ?? []).map((column) => (
          <div key={column.id} className="column">
            <h3>{column.name}</h3>
            {column.tasks.map((task) => (
              <div key={task.id} className="task-card">
                <strong>{task.title}</strong>
                {task.description && <p>{task.description}</p>}
                <span className="badge">{task.priority}</span>
              </div>
            ))}
            <div className="form-stack">
              <input
                className="input"
                placeholder="New task"
                value={drafts[column.id] ?? ""}
                onChange={(event) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [column.id]: event.target.value
                  }))
                }
              />
              <button className="button" onClick={() => createTask(column.id)}>
                Add task
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ProjectBoard;
