import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { apiJson } from "../lib/api";
import TaskModal from "../components/TaskModal";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
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

type Member = {
  userId: string;
  role: "owner" | "admin" | "member";
  user: {
    id: string;
    email: string;
    displayName?: string | null;
  };
};

type Project = {
  id: string;
  name: string;
  boards: Board[];
  members: Member[];
};

type ProjectResponse = {
  project: Project;
};

type SearchResult = {
  id: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
};

type TaskDetailResponse = {
  task: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    columnId: string;
    assignees: { userId: string }[];
    comments: {
      id: string;
      content: string;
      author: { id: string; email: string; displayName?: string | null };
      mentions: { id: string; userId: string }[];
    }[];
    attachments: {
      id: string;
      fileName: string;
      fileSize: number;
      url: string;
    }[];
  } | null;
};

const ProjectBoard = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiJson<ProjectResponse>(`/api/projects/${projectId}`),
    enabled: Boolean(projectId)
  });

  const [boardName, setBoardName] = useState("");
  const [columnName, setColumnName] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: taskDetail } = useQuery({
    queryKey: ["task", selectedTaskId],
    queryFn: () => apiJson<TaskDetailResponse>(`/api/tasks/${selectedTaskId}`),
    enabled: Boolean(selectedTaskId)
  });

  const { data: searchResults } = useQuery({
    queryKey: ["project", projectId, "search", searchQuery],
    queryFn: () =>
      apiJson<{ tasks: SearchResult[] }>(
        `/api/projects/${projectId}/tasks/search?q=${encodeURIComponent(searchQuery)}`
      ),
    enabled: Boolean(projectId && searchQuery.length > 0)
  });

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
    socket.on("notification:new", refresh);

    return () => {
      socket.emit("project:leave", { projectId });
      socket.disconnect();
    };
  }, [projectId, queryClient]);

  const boards = data?.project.boards ?? [];
  const members = data?.project.members ?? [];
  const currentMember = members.find((member) => member.userId === user?.id);
  const activeBoard =
    boards.find((board) => board.id === selectedBoardId) ?? boards[0];

  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  const columns = activeBoard?.columns ?? [];

  const createBoard = async () => {
    if (!boardName || !projectId) {
      return;
    }

    await apiJson(`/api/projects/${projectId}/boards`, {
      method: "POST",
      body: JSON.stringify({ name: boardName })
    });
    setBoardName("");
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const createColumn = async () => {
    if (!columnName || !activeBoard) {
      return;
    }

    await apiJson(`/api/boards/${activeBoard.id}/columns`, {
      method: "POST",
      body: JSON.stringify({ name: columnName })
    });
    setColumnName("");
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const renameColumn = async (columnId: string, name: string) => {
    await apiJson(`/api/columns/${columnId}`, {
      method: "PATCH",
      body: JSON.stringify({ name })
    });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const deleteColumn = async (columnId: string) => {
    await apiJson(`/api/columns/${columnId}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const createTask = async (columnId: string) => {
    if (!activeBoard) {
      return;
    }

    const title = drafts[columnId];
    if (!title) {
      return;
    }

    await apiJson(`/api/boards/${activeBoard.id}/columns/${columnId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title })
    });

    setDrafts((prev) => ({ ...prev, [columnId]: "" }));
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const taskColumns = useMemo(
    () => columns.map((column) => ({ id: column.id, name: column.name })),
    [columns]
  );

  const inviteMember = async () => {
    if (!inviteEmail || !projectId) {
      return;
    }
    await apiJson(`/api/projects/${projectId}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email: inviteEmail })
    });
    setInviteEmail("");
  };

  const removeMember = async (memberId: string) => {
    if (!projectId) {
      return;
    }
    await apiJson(`/api/projects/${projectId}/members/${memberId}`, {
      method: "DELETE"
    });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="card">
        <div className="inline-row">
          <h3>{data?.project.name ?? "Project"}</h3>
          <p className="badge">Realtime board sync is enabled</p>
        </div>
        <div className="inline-row">
          <select
            className="input"
            value={activeBoard?.id}
            onChange={(event) => setSelectedBoardId(event.target.value)}
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="New board name"
            value={boardName}
            onChange={(event) => setBoardName(event.target.value)}
          />
          <button className="button" onClick={createBoard}>
            Add board
          </button>
        </div>
        <div className="inline-row">
          <input
            className="input"
            placeholder="Search tasks"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        {searchQuery && (
          <div className="panel-list">
            {(searchResults?.tasks ?? []).map((task) => (
              <button
                type="button"
                key={task.id}
                className="panel-item"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <strong>{task.title}</strong>
                <span>{task.description ?? "No description"}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h3>Team</h3>
        {currentMember?.role === "owner" && (
          <div className="inline-row">
            <input
              className="input"
              placeholder="Invite by email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <button className="button" onClick={inviteMember}>
              Send invite
            </button>
          </div>
        )}
        <div className="panel-list">
          {members.map((member) => (
            <div key={member.userId} className="panel-item">
              <strong>{member.user.displayName ?? member.user.email}</strong>
              <span className="badge">{member.role}</span>
              {currentMember?.role === "owner" && member.userId !== user?.id && (
                <button
                  className="button secondary"
                  onClick={() => removeMember(member.userId)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="board">
        {columns.map((column) => (
          <div key={column.id} className="column">
            <div className="inline-row">
              <input
                className="input"
                value={column.name}
                onChange={(event) => renameColumn(column.id, event.target.value)}
              />
              <button
                className="button secondary"
                onClick={() => deleteColumn(column.id)}
              >
                Delete
              </button>
            </div>
            {column.tasks.map((task) => (
              <div
                key={task.id}
                className="task-card"
                onClick={() => setSelectedTaskId(task.id)}
              >
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
        <div className="column">
          <h3>Add column</h3>
          <input
            className="input"
            placeholder="Column name"
            value={columnName}
            onChange={(event) => setColumnName(event.target.value)}
          />
          <button className="button" onClick={createColumn}>
            Add column
          </button>
        </div>
      </section>

      {selectedTaskId && taskDetail?.task && (
        <TaskModal
          task={taskDetail.task}
          members={members}
          columns={taskColumns}
          onClose={() => setSelectedTaskId(null)}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            queryClient.invalidateQueries({
              queryKey: ["task", selectedTaskId]
            });
          }}
        />
      )}
    </div>
  );
};

export default ProjectBoard;
