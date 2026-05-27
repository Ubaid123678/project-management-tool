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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, displayName || undefined);
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
          <h1>Create a workspace that feels effortless.</h1>
          <p>Bring your project boards, notifications, and team discussions into one clear system.</p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-icon">&#10003;</span>
              Craft workflows in minutes
            </div>
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-icon">&#10003;</span>
              Invite, assign, and ship together
            </div>
            <div className="auth-brand-feature">
              <span className="auth-brand-feature-icon">&#10003;</span>
              Free for small teams
            </div>
          </div>
        </div>

        <div className="auth-form">
          <h2>Create your workspace</h2>
          <p className="auth-form-subtitle">Plan, track, and ship with clarity</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                className="input"
                placeholder="Your name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
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
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
