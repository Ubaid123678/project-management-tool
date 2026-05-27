import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateProfile = async () => {
    setError("");
    setMessage("");
    await apiJson("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ displayName })
    });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    setMessage("Profile updated");
  };

  const changePassword = async () => {
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    await apiJson("/api/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Password changed successfully");
  };

  const uploadAvatar = async (file: File) => {
    setError("");
    setMessage("");
    const body = new FormData();
    body.append("file", file);
    const response = await apiFetch("/api/users/me/avatar", {
      method: "POST",
      body
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(err.message ?? "Upload failed");
    }
    queryClient.invalidateQueries({ queryKey: ["me"] });
    setMessage("Avatar updated");
  };

  return (
    <div className="profile-page" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card">
        <div className="profile-header">
          <label style={{ cursor: "pointer", position: "relative" }}>
            <div className="profile-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
              ) : (
                (user?.displayName ?? user?.email ?? "U")[0].toUpperCase()
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
            />
          </label>
          <div className="profile-info">
            <h2>{user?.displayName ?? "User"}</h2>
            <p>{user?.email}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Click avatar to change</p>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "var(--success-bg)", color: "var(--success)", fontSize: 14 }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius)", background: "var(--danger-bg)", color: "var(--danger)", fontSize: 14 }}>
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Profile details</h3>
            <p className="section-subtitle">Update your display name</p>
          </div>
        </div>
        <div className="card-body form-stack">
          <div className="form-group">
            <label className="form-label">Display name</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>
          <div>
            <button className="btn btn-primary" onClick={updateProfile}>Save</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Change password</h3>
            <p className="section-subtitle">Update your account password</p>
          </div>
        </div>
        <div className="card-body form-stack">
          <div className="form-group">
            <label className="form-label">Current password</label>
            <input
              className="input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">New password</label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ maxWidth: 320 }}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <button className="btn btn-primary" onClick={changePassword}>Change password</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
