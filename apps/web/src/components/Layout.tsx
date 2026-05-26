import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import NotificationsPanel from "./NotificationsPanel";

type Project = {
  id: string;
  name: string;
};

type ProjectsResponse = {
  projects: Project[];
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiJson<ProjectsResponse>("/api/projects")
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Project Flow</h1>
        <p className="subtle">Operations overview</p>
        <nav>
          <Link
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            to="/"
          >
            Dashboard
          </Link>
          {(data?.projects ?? []).map((project) => (
            <Link
              key={project.id}
              className={`nav-link ${
                location.pathname.includes(project.id) ? "active" : ""
              }`}
              to={`/projects/${project.id}`}
            >
              {project.name}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="topbar">
          <h2>{location.pathname === "/" ? "Workspace" : "Project"}</h2>
          <div className="user-chip">
            <button
              className="button secondary"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              Notifications
            </button>
            {user?.displayName ?? user?.email}
            <button className="button secondary" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>
        <main className="main-content">
          <div className="page">
            {showNotifications && <NotificationsPanel />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
