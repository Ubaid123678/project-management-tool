import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "../lib/api";
import { Link } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  description?: string | null;
};

type ProjectsResponse = {
  projects: Project[];
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiJson<ProjectsResponse>("/api/projects")
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const createProject = async () => {
    setError("");
    try {
      await apiJson("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description })
      });
      setName("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="grid" style={{ gap: 28 }}>
      <section className="card">
        <h3>Start a new project</h3>
        <div className="form-stack">
          <input
            className="input"
            placeholder="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="input"
            placeholder="Short description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {error && <div className="badge">{error}</div>}
          <button className="button" onClick={createProject}>
            Create project
          </button>
        </div>
      </section>

      <section>
        <h3>Active projects</h3>
        <div className="grid project-grid">
          {(data?.projects ?? []).map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <div className="card">
                <h4>{project.name}</h4>
                <p className="badge">{project.description ?? "No description"}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
