import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(email, password, organizationId);
      navigate("/");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        "Signup failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <form onSubmit={handleSubmit} style={{ width: 320, padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2 style={{ marginBottom: 16 }}>Create account</h2>
        <label style={{ display: "block", marginBottom: 8 }}>
          <div style={{ marginBottom: 4 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          <div style={{ marginBottom: 4 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ marginBottom: 4 }}>Organization ID</div>
          <input
            type="text"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <button type="submit" disabled={submitting} style={{ width: "100%", padding: 10 }}>
          {submitting ? "Signing up..." : "Sign up"}
        </button>
        <div style={{ marginTop: 12, textAlign: "center" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
