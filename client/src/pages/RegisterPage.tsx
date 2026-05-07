import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Ошибка с сервера — data.error
        throw new Error(data.error || data.message || "Registration failed");
      }
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/rooms");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError("Server is not available. Make sure the server is running.");
      } else {
        setError("Network error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
      <GlassCard style={{ width: "100%", maxWidth: "420px", padding: "40px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Create Account</h2>
        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", color: "#EF4444", fontSize: "0.85rem" }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <Input label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button variant="purple" type="submit" disabled={loading}>{loading ? "Loading..." : "Register"}</Button>
        </form>
        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem", color: "var(--text-dim)" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </GlassCard>
    </div>
  );
};

export default RegisterPage;
