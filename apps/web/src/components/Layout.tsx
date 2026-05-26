import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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
  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiJson<ProjectsResponse>("/api/projects")
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Project Flow</h1>
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
            {user?.displayName ?? user?.email}
            <button className="button secondary" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
