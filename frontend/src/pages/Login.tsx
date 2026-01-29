import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        "Login failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 16 }}>
      <form onSubmit={handleSubmit} className="glass-card" style={{ width: 360, padding: 32 }}>
        <h2 style={{ marginBottom: 24, textAlign: "center" }}>Sign in</h2>
        <label style={{ display: "block", marginBottom: 16 }}>
          <div style={{ marginBottom: 6 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{ width: "100%", padding: 12, borderRadius: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 20 }}>
          <div style={{ marginBottom: 6 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{ width: "100%", padding: 12, borderRadius: 8 }}
          />
        </label>
        {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
        <button type="submit" disabled={submitting} style={{ width: "100%", padding: 14, borderRadius: 8, fontSize: "1rem" }}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <div style={{ marginTop: 20, textAlign: "center", color: "rgba(248, 250, 252, 0.7)" }}>
          Need an account? <Link to="/signup">Sign up</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
