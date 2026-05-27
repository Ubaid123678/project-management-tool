import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand auth-brand-visible">
          <div className="auth-brand-icon">PF</div>
          <h1>Focus the team on the work that matters most.</h1>
          <p>Track projects, move tasks through your pipeline, and keep every conversation in one place.</p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-icon">&#10003;</span>
              Real-time updates for every board
            </div>
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-icon">&#10003;</span>
              Find any task in seconds with search
            </div>
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-icon">&#10003;</span>
              Collaborate with comments and mentions
            </div>
          </div>
        </div>

        <div className="auth-form">
          <h2>Welcome back</h2>
          <p className="auth-form-subtitle">Sign in to pick up your work</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-footer">
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
