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

type SearchResult = {
  id: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
};

type TaskDetail = {
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
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const cls = priority === "low" ? "priority-low" :
    priority === "medium" ? "priority-medium" :
    priority === "high" ? "priority-high" : "priority-urgent";
  return <span className={`badge ${cls}`}>{priority}</span>;
};

const ProjectBoard = () => {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => apiJson<{ project: { id: string; name: string; boards: Board[]; members: Member[] } }>(`/api/projects/${projectId}`),
    enabled: Boolean(projectId)
  });

  const [boardName, setBoardName] = useState("");
  const [columnName, setColumnName] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showTeam, setShowTeam] = useState(false);

  const { data: taskDetail } = useQuery({
    queryKey: ["task", selectedTaskId],
    queryFn: () => apiJson<{ task: TaskDetail | null }>(`/api/tasks/${selectedTaskId}`),
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
    if (!projectId) return;

    const socket = io(API_URL, { withCredentials: true });
    socket.emit("project:join", { projectId });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["project", projectId] });

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
  const currentMember = members.find((m) => m.userId === user?.id);
  const activeBoard = boards.find((b) => b.id === selectedBoardId) ?? boards[0];

  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  const columns = activeBoard?.columns ?? [];

  const createBoard = async () => {
    if (!boardName || !projectId) return;
    await apiJson(`/api/projects/${projectId}/boards`, {
      method: "POST",
      body: JSON.stringify({ name: boardName })
    });
    setBoardName("");
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const createColumn = async () => {
    if (!columnName || !activeBoard) return;
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
    if (!activeBoard) return;
    const title = drafts[columnId];
    if (!title) return;
    await apiJson(`/api/boards/${activeBoard.id}/columns/${columnId}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title })
    });
    setDrafts((prev) => ({ ...prev, [columnId]: "" }));
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const taskColumns = useMemo(
    () => columns.map((c) => ({ id: c.id, name: c.name })),
    [columns]
  );

  const inviteMember = async () => {
    if (!inviteEmail || !projectId) return;
    await apiJson(`/api/projects/${projectId}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email: inviteEmail })
    });
    setInviteEmail("");
  };

  const removeMember = async (memberId: string) => {
    if (!projectId) return;
    await apiJson(`/api/projects/${projectId}/members/${memberId}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["project", projectId] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card">
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {boards.length > 0 && (
                <div className="board-tabs">
                  {boards.map((board) => (
                    <button
                      key={board.id}
                      className={`board-tab ${activeBoard?.id === board.id ? "active" : ""}`}
                      onClick={() => setSelectedBoardId(board.id)}
                    >
                      {board.name}
                    </button>
                  ))}
                </div>
              )}
              <input
                className="input"
                placeholder="New board"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                style={{ width: 140 }}
              />
              <button className="btn btn-secondary btn-sm" onClick={createBoard}>Add</button>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 200 }}
                />
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowTeam(!showTeam)}>
                {showTeam ? "Hide team" : `Team (${members.length})`}
              </button>
            </div>
          </div>

          {searchQuery && searchResults && (
            <div className="search-results animate-slide-up">
              {searchResults.tasks.length === 0 ? (
                <div style={{ padding: "16px 20px", fontSize: 14, color: "var(--text-secondary)" }}>
                  No tasks found for "{searchQuery}"
                </div>
              ) : (
                searchResults.tasks.map((task) => (
                  <button
                    key={task.id}
                    className="search-result-item"
                    onClick={() => { setSelectedTaskId(task.id); setSearchQuery(""); }}
                  >
                    <span className="search-result-title">{task.title}</span>
                    {task.description && <span className="search-result-desc">{task.description}</span>}
                    <PriorityBadge priority={task.priority} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showTeam && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Team members</h3>
              <p className="section-subtitle">Manage access and roles</p>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {currentMember?.role === "owner" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  className="input"
                  placeholder="Invite by email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
                <button className="btn btn-primary btn-sm" onClick={inviteMember}>Send invite</button>
              </div>
            )}
            <div className="team-list">
              {members.map((member) => (
                <div key={member.userId} className="team-member">
                  <div className="team-member-left">
                    <div className="team-member-avatar">
                      {(member.user.displayName ?? member.user.email)[0].toUpperCase()}
                    </div>
                    <div className="team-member-info">
                      <div className="team-member-name">{member.user.displayName ?? member.user.email}</div>
                      <div className="team-member-email">{member.user.email}</div>
                    </div>
                  </div>
                  <div className="team-member-right">
                    <span className={`badge ${member.role === "owner" ? "badge-primary" : member.role === "admin" ? "badge-warning" : "badge-neutral"}`}>
                      {member.role}
                    </span>
                    {currentMember?.role === "owner" && member.userId !== user?.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeMember(member.userId)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="board-columns">
        {columns.map((column) => (
          <div key={column.id} className="board-column animate-slide-up">
            <div className="board-column-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <input
                  className="input"
                  value={column.name}
                  onChange={(e) => renameColumn(column.id, e.target.value)}
                  style={{ fontWeight: 600, fontSize: 13, padding: "4px 8px", minWidth: 0, width: "auto" }}
                />
                <span className="board-column-count">{column.tasks.length}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteColumn(column.id)} style={{ color: "var(--danger)" }}>
                &times;
              </button>
            </div>

            {column.tasks.map((task) => (
              <div
                key={task.id}
                className="task-card animate-fade-in"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div className="task-card-title">{task.title}</div>
                {task.description && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, lineHeight: 1.4 }}>{task.description}</div>
                )}
                <div className="task-card-meta">
                  <PriorityBadge priority={task.priority} />
                  {task.dueDate && (
                    <span className="badge badge-neutral">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                placeholder="Add task"
                value={drafts[column.id] ?? ""}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [column.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") createTask(column.id); }}
              />
              <button className="btn btn-primary btn-sm" onClick={() => createTask(column.id)}>Add</button>
            </div>
          </div>
        ))}

        <div className="board-add-column">
          <h4 style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Add column</h4>
          <input
            className="input"
            placeholder="Column name"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createColumn(); }}
          />
          <button className="btn btn-primary btn-sm" onClick={createColumn}>Add column</button>
        </div>
      </div>

      {selectedTaskId && taskDetail?.task && (
        <TaskModal
          task={taskDetail.task}
          members={members}
          columns={taskColumns}
          onClose={() => setSelectedTaskId(null)}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
            queryClient.invalidateQueries({ queryKey: ["task", selectedTaskId] });
          }}
        />
      )}
    </div>
  );
};

export default ProjectBoard;
