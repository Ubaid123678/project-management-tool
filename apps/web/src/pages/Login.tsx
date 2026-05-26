import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <div className="auth-hero">
          <span className="badge">Project Flow</span>
          <h1>Focus the team on the work that matters most.</h1>
          <p>
            Track projects, move tasks through your pipeline, and keep every
            conversation in one place.
          </p>
          <div className="hero-metrics">
            <div>
              <strong>Realtime</strong>
              <span>Live updates for every board</span>
            </div>
            <div>
              <strong>Search</strong>
              <span>Find tasks in seconds</span>
            </div>
          </div>
        </div>
        <div className="card auth-card">
          <h2>Welcome back</h2>
          <p className="subtle">Sign in to pick up your work</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <div className="badge danger">{error}</div>}
            <button className="button" type="submit">
              Sign in
            </button>
          </form>
          <p className="subtle">
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
