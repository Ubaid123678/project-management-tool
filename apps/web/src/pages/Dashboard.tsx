import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "../lib/api";
import { Link } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  description?: string | null;
};

type Invitation = {
  id: string;
  projectId: string;
  project: { name: string };
  createdAt: string;
};

const PROJECT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6"];

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiJson<{ projects: Project[] }>("/api/projects")
  });

  const { data: invites } = useQuery({
    queryKey: ["invitations"],
    queryFn: () => apiJson<{ invitations: Invitation[] }>("/api/projects/invitations/pending"),
    retry: false
  });

  const createProject = async () => {
    if (!name.trim()) return;
    setError("");
    try {
      await apiJson("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description })
      });
      setName("");
      setDescription("");
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    await apiJson(`/api/projects/invitations/${invitationId}/accept`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["invitations"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const projects = data?.projects ?? [];
  const pendingInvites = invites?.invitations ?? [];

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Active projects</h2>
          <p className="section-subtitle">Jump back into any workspace</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "New project"}
        </button>
      </div>

      {showCreate && (
        <div className="card animate-slide-up mb-16">
          <div className="card-body form-stack">
            <div className="form-group">
              <label className="form-label">Project name</label>
              <input
                className="input"
                placeholder="e.g. Marketing Campaign"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input
                className="input"
                placeholder="What is this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div>
              <button className="btn btn-primary" onClick={createProject}>
                Create project
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="card mb-16 animate-slide-up">
          <div className="card-header">
            <div>
              <h3 className="section-title" style={{ fontSize: 16 }}>Pending invitations</h3>
              <p className="section-subtitle">You've been invited to join these projects</p>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="invitation-card" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 8 }}>
                <div className="invitation-info">
                  <span className="invitation-title">{invite.project.name}</span>
                  <span className="invitation-meta">Invited you to join this project</span>
                </div>
                <div className="invitation-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => acceptInvitation(invite.id)}>
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && !showCreate ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: "0 auto" }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started with your team.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              Create your first project
            </button>
          </div>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project, i) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="card project-card">
              <div className="project-card-icon" style={{ background: PROJECT_COLORS[i % PROJECT_COLORS.length] }}>
                {project.name[0].toUpperCase()}
              </div>
              <div>
                <h4>{project.name}</h4>
                <p>{project.description || "No description"}</p>
              </div>
              <div className="project-card-footer">
                <span>Open project</span>
                <span>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
