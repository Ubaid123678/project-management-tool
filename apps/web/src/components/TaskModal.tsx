import { useState } from "react";
import { apiFetch, apiJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Member = {
  userId: string;
  user: { id: string; email: string; displayName?: string | null };
};

type Comment = {
  id: string;
  content: string;
  author: { id: string; displayName?: string | null; email: string };
  mentions: { id: string; userId: string }[];
};

type Attachment = {
  id: string;
  fileName: string;
  fileSize: number;
  url: string;
};

type TaskDetail = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  columnId: string;
  assignees: { userId: string }[];
  comments: Comment[];
  attachments: Attachment[];
};

type Props = {
  task: TaskDetail;
  members: Member[];
  columns: { id: string; name: string }[];
  onClose: () => void;
  onRefresh: () => void;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TaskModal = ({ task, members, columns, onClose, onRefresh }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate?.slice(0, 10) ?? "");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const assigneeIds = task.assignees.map((a) => a.userId);

  const saveTask = async () => {
    setError("");
    setSaving(true);
    try {
      await apiJson(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null
        })
      });
      onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updateAssignees = async (nextIds: string[]) => {
    await apiJson(`/api/tasks/${task.id}/assignees`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeIds: nextIds })
    });
    onRefresh();
  };

  const moveTask = async (columnId: string) => {
    await apiJson(`/api/tasks/${task.id}/move`, {
      method: "PATCH",
      body: JSON.stringify({ targetColumnId: columnId, targetPosition: 0 })
    });
    onRefresh();
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    await apiJson(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: comment })
    });
    setComment("");
    onRefresh();
  };

  const deleteComment = async (commentId: string) => {
    await apiJson(`/api/comments/${commentId}`, { method: "DELETE" });
    onRefresh();
  };

  const uploadAttachment = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await apiFetch(`/api/tasks/${task.id}/attachments`, {
      method: "POST",
      body
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(err.message ?? "Upload failed");
    }
    onRefresh();
  };

  const deleteAttachment = async (attachmentId: string) => {
    await apiJson(`/api/tasks/${task.id}/attachments/${attachmentId}`, { method: "DELETE" });
    onRefresh();
  };

  const deleteTask = async () => {
    setDeleting(true);
    await apiJson(`/api/tasks/${task.id}`, { method: "DELETE" });
    onClose();
    onRefresh();
  };

  const isAssignee = (memberId: string) => assigneeIds.includes(memberId);
  const toggleAssignee = async (memberId: string) => {
    const next = isAssignee(memberId)
      ? assigneeIds.filter((id) => id !== memberId)
      : [...assigneeIds, memberId];
    await updateAssignees(next);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <h3>Task details</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: 18, fontWeight: 600, border: "none", padding: "0 0 8px 0", borderRadius: 0, borderBottom: "1px solid var(--border)" }}
            />

            <textarea
              className="input"
              rows={3}
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Priority</label>
                <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as TaskDetail["priority"])}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Due date</label>
                <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="form-label">Move to column</label>
                <select className="input" value={task.columnId} onChange={(e) => moveTask(e.target.value)}>
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <span className="modal-section-title">Assignees</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {members.map((member) => (
                <button
                  key={member.userId}
                  className={`btn btn-sm ${isAssignee(member.userId) ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => toggleAssignee(member.userId)}
                >
                  {member.user.displayName ?? member.user.email}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <span className="modal-section-title">Attachments</span>
            <label className="file-upload-area">
              <input
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAttachment(file);
                }}
              />
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Click to upload a file</div>
            </label>
            {task.attachments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {task.attachments.map((att) => (
                  <div key={att.id} className="file-row">
                    <div className="file-info">
                      <span className="file-name">
                        <a href={att.url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
                          {att.fileName}
                        </a>
                      </span>
                      <span className="file-size">{formatFileSize(att.fileSize)}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteAttachment(att.id)} style={{ color: "var(--danger)" }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-section">
            <span className="modal-section-title">Comments</span>
            <div style={{ display: "flex", gap: 8 }}>
              <textarea
                className="input"
                rows={2}
                placeholder="Add a comment... Use @username to mention"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
              />
              <button className="btn btn-primary btn-sm" onClick={addComment} style={{ alignSelf: "flex-end" }}>Send</button>
            </div>
            {task.comments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {[...task.comments].reverse().map((c) => (
                  <div key={c.id} className="comment">
                    <div className="comment-header">
                      <span className="comment-author">{c.author.displayName ?? c.author.email}</span>
                      {c.author.id === user?.id && (
                        <button className="btn btn-ghost btn-sm" onClick={() => deleteComment(c.id)} style={{ color: "var(--danger)" }}>
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="comment-content">{c.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {error && <div className="form-error" style={{ marginRight: "auto" }}>{error}</div>}
          <button className="btn btn-danger" onClick={deleteTask} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete task"}
          </button>
          <button className="btn btn-primary" onClick={saveTask} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
