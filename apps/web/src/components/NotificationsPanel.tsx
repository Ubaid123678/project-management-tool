import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "../lib/api";

type Notification = {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

type Preferences = {
  taskAssigned: boolean;
  taskReassigned: boolean;
  taskMention: boolean;
  taskComment: boolean;
  taskDeleted: boolean;
  projectDeleted: boolean;
  projectInvite: boolean;
  memberRemoved: boolean;
};

const PREF_LABELS: Record<keyof Preferences, string> = {
  taskAssigned: "Task assigned",
  taskReassigned: "Task reassigned",
  taskMention: "Mentioned in comment",
  taskComment: "Comment on task",
  taskDeleted: "Task deleted",
  projectDeleted: "Project deleted",
  projectInvite: "Project invitation",
  memberRemoved: "Member removed"
};

const NotificationsPanel = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiJson<{ notifications: Notification[] }>("/api/notifications")
  });

  const { data: prefs } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => apiJson<{ preferences: Preferences | null }>("/api/notifications/preferences")
  });

  const markRead = async (id: string) => {
    await apiJson(`/api/notifications/${id}/read`, { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAll = async () => {
    await apiJson("/api/notifications/read-all", { method: "PATCH" });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const updatePref = async (key: keyof Preferences, value: boolean) => {
    await apiJson("/api/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify({ [key]: value })
    });
    queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
  };

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="notifications-panel animate-slide-up">
      <div className="notifications-header">
        <h4>Notifications {unreadCount > 0 && <span className="badge badge-primary">{unreadCount}</span>}</h4>
        <button className="btn btn-secondary btn-sm" onClick={markAll}>
          Mark all read
        </button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div style={{ padding: "24px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((item) => (
            <button
              key={item.id}
              className={`notification-item ${item.readAt ? "" : "unread"}`}
              onClick={() => markRead(item.id)}
            >
              <span className="notification-title">{item.title}</span>
              <span className="notification-body">{item.body}</span>
              <span className="notification-time">
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit"
                })}
              </span>
            </button>
          ))
        )}
      </div>

      {prefs?.preferences && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <div className="notifications-header" style={{ background: "transparent" }}>
            <h4>Preferences</h4>
          </div>
          <div className="prefs-grid">
            {(Object.entries(prefs.preferences) as [keyof Preferences, boolean][]).map(([key, value]) => (
              <div key={key} className="toggle-row">
                <label>{PREF_LABELS[key] ?? key}</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => updatePref(key, e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
