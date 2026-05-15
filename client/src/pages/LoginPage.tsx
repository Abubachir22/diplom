import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useTranslation } from "../i18n/LanguageContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Invalid email or password') throw new Error(t('auth.login.error'));
        if (data.error === 'Invalid data') throw new Error(t('auth.register.invalidData'));
        throw new Error(data.error || data.message || "Login failed");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/rooms");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else if (err instanceof TypeError && err.message === "Failed to fetch") setError(t('error.serverUnavailable'));
      else setError(t('error.network'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
      <GlassCard style={{ width: "100%", maxWidth: "420px", padding: "40px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>{t('auth.login.title')}</h2>
        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", color: "#EF4444", fontSize: "0.85rem" }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Input label={t('auth.login.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label={t('auth.login.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button variant="purple" type="submit" disabled={loading}>{loading ? "..." : t('auth.login.submit')}</Button>
          <Button variant="outline" type="button" onClick={() => navigate("/rooms")}>{t('auth.login.guest')}</Button>
        </form>
        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem", color: "var(--text-dim)" }}>
          {t('auth.login.noAccount')} <Link to="/register">{t('auth.login.register')}</Link>
        </p>
      </GlassCard>
    </div>
  );
};

export default LoginPage;