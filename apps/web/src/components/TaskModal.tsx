import { useState } from "react";
import { apiFetch, apiJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Member = {
  userId: string;
  user: {
    id: string;
    email: string;
    displayName?: string | null;
  };
};

type TaskAssignee = {
  userId: string;
};

type Mention = {
  id: string;
  userId: string;
  positionStart: number;
  positionEnd: number;
};

type Comment = {
  id: string;
  content: string;
  author: {
    id: string;
    displayName?: string | null;
    email: string;
  };
  mentions: Mention[];
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
  assignees: TaskAssignee[];
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

const TaskModal = ({ task, members, columns, onClose, onRefresh }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate?.slice(0, 10) ?? "");
  const [assigneeIds, setAssigneeIds] = useState(
    task.assignees.map((assignee) => assignee.userId)
  );
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const saveTask = async () => {
    setError("");
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
    }
  };

  const updateAssignees = async (nextIds: string[]) => {
    setAssigneeIds(nextIds);
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
    if (!comment) {
      return;
    }
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
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message ?? "Upload failed");
    }
    onRefresh();
  };

  const deleteAttachment = async (attachmentId: string) => {
    await apiJson(`/api/tasks/${task.id}/attachments/${attachmentId}`, {
      method: "DELETE"
    });
    onRefresh();
  };

  const deleteTask = async () => {
    await apiJson(`/api/tasks/${task.id}`, { method: "DELETE" });
    onClose();
    onRefresh();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>Task detail</h3>
          <button className="button secondary" onClick={onClose}>
            Close
          </button>
        </div>
        {error && <div className="badge">{error}</div>}
        <div className="form-stack">
          <input
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="inline-row">
            <select
              className="input"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TaskDetail["priority"])
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              className="input"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
            <select
              className="input"
              value={task.columnId}
              onChange={(event) => moveTask(event.target.value)}
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </div>
          <div className="inline-row">
            <strong>Assignees</strong>
            <div className="chip-row">
              {members.map((member) => (
                <label key={member.userId} className="chip">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(member.userId)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...assigneeIds, member.userId]
                        : assigneeIds.filter((id) => id !== member.userId);
                      updateAssignees(next);
                    }}
                  />
                  {member.user.displayName ?? member.user.email}
                </label>
              ))}
            </div>
          </div>
          <div className="inline-row">
            <button className="button" onClick={saveTask}>
              Save
            </button>
            <button className="button secondary" onClick={deleteTask}>
              Delete task
            </button>
          </div>
        </div>

        <div className="panel-section">
          <h4>Attachments</h4>
          <input
            className="input"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                uploadAttachment(file);
              }
            }}
          />
          <div className="panel-list">
            {task.attachments.map((attachment) => (
              <div key={attachment.id} className="file-row">
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  {attachment.fileName}
                </a>
                <button
                  className="button secondary"
                  onClick={() => deleteAttachment(attachment.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <h4>Comments</h4>
          <div className="form-stack">
            <textarea
              className="input"
              rows={2}
              placeholder="Add a comment. Use @username to mention"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <button className="button" onClick={addComment}>
              Comment
            </button>
          </div>
          <div className="panel-list">
            {task.comments.map((item) => (
              <div key={item.id} className="comment">
                <strong>{item.author.displayName ?? item.author.email}</strong>
                <p>{item.content}</p>
                {item.author.id === user?.id && (
                  <button
                    className="button secondary"
                    onClick={() => deleteComment(item.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
