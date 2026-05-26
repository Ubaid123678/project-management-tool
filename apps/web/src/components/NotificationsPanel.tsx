import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "../lib/api";

export type Notification = {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

type NotificationResponse = {
  notifications: Notification[];
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

type PreferencesResponse = {
  preferences: Preferences | null;
};

const NotificationsPanel = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiJson<NotificationResponse>("/api/notifications")
  });

  const { data: prefs } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => apiJson<PreferencesResponse>("/api/notifications/preferences")
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

  const unreadCount = (data?.notifications ?? []).filter(
    (item) => !item.readAt
  ).length;

  return (
    <div className="panel">
      <div className="panel-header">
        <h4>Notifications</h4>
        <button className="button secondary" onClick={markAll}>
          Mark all read
        </button>
      </div>
      <p className="badge">Unread: {unreadCount}</p>
      <div className="panel-list">
        {(data?.notifications ?? []).map((item) => (
          <button
            type="button"
            key={item.id}
            className={`panel-item ${item.readAt ? "" : "panel-item-unread"}`}
            onClick={() => markRead(item.id)}
          >
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </button>
        ))}
      </div>
      <div className="panel-section">
        <h5>Preferences</h5>
        {prefs?.preferences && (
          <div className="panel-grid">
            {Object.entries(prefs.preferences).map(([key, value]) => (
              <label key={key} className="toggle-row">
                <span>{key}</span>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    updatePref(key as keyof Preferences, event.target.checked)
                  }
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
