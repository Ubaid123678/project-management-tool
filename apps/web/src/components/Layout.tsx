import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useUIStore } from "../store/ui";

const ProjectsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-link-icon">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ProjectIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-link-icon">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-link-icon">
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const AvatarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showMobileSidebar, setMobileSidebar } = useUIStore();
  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiJson<{ projects: { id: string; name: string }[] }>("/api/projects")
  });

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo" onClick={() => setMobileSidebar(false)}>
          <div className="sidebar-logo-icon">PF</div>
          <span className="sidebar-logo-text">Project Flow</span>
        </Link>
      </div>

      <div className="sidebar-label">Main</div>
      <nav className="sidebar-nav">
        <Link
          to="/"
          className={`sidebar-link ${isActive("/") && location.pathname === "/" ? "active" : ""}`}
          onClick={() => setMobileSidebar(false)}
        >
          <DashboardIcon />
          Dashboard
        </Link>
      </nav>

      <div className="sidebar-label">Projects</div>
      <nav className="sidebar-nav">
        {(data?.projects ?? []).map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className={`sidebar-link ${isActive(`/projects/${project.id}`) ? "active" : ""}`}
            onClick={() => setMobileSidebar(false)}
          >
            <ProjectIcon />
            <span className="truncate">{project.name}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link to="/profile" className="sidebar-user" onClick={() => setMobileSidebar(false)}>
          <div className="sidebar-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" />
            ) : (
              (user?.displayName ?? user?.email ?? "U")[0].toUpperCase()
            )}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name truncate">
              {user?.displayName ?? "User"}
            </div>
            <div className="sidebar-user-email truncate">
              {user?.email ?? ""}
            </div>
          </div>
        </Link>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      {showMobileSidebar && (
        <div className="sidebar-backdrop" onClick={() => setMobileSidebar(false)} />
      )}
      <aside className={`sidebar ${showMobileSidebar ? "open" : ""}`}>
        {sidebarContent}
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="sidebar-mobile-toggle topbar-btn" onClick={() => setMobileSidebar(true)}>
              <MenuIcon />
            </button>
            <div className="topbar-breadcrumb">
              {location.pathname === "/" && <span className="topbar-title">Dashboard</span>}
              {location.pathname.startsWith("/projects/") && (
                <>
                  <Link to="/">Dashboard</Link>
                  <span className="topbar-breadcrumb-sep">/</span>
                  <span className="topbar-title">
                    {data?.projects.find(p => location.pathname.includes(p.id))?.name ?? "Project"}
                  </span>
                </>
              )}
              {location.pathname === "/profile" && (
                <>
                  <Link to="/">Dashboard</Link>
                  <span className="topbar-breadcrumb-sep">/</span>
                  <span className="topbar-title">Profile</span>
                </>
              )}
            </div>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" onClick={logout}>
              <LogoutIcon />
              Sign out
            </button>
          </div>
        </header>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
