import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await register(email, password, displayName || undefined);
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
          <h1>Create a workspace that feels effortless.</h1>
          <p>
            Bring your project boards, notifications, and team discussions into
            one clear system.
          </p>
          <div className="hero-metrics">
            <div>
              <strong>Boards</strong>
              <span>Craft workflows in minutes</span>
            </div>
            <div>
              <strong>Teams</strong>
              <span>Invite, assign, and ship</span>
            </div>
          </div>
        </div>
        <div className="card auth-card">
          <h2>Create your workspace</h2>
          <p className="subtle">Plan, track, and ship with clarity</p>
          <form className="form-stack" onSubmit={handleSubmit}>
            <input
              className="input"
              placeholder="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
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
              Create account
            </button>
          </form>
          <p className="subtle">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
