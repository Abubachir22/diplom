import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useTranslation } from "../i18n/LanguageContext";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError(t('auth.register.passwordMismatch')); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'Email already in use') throw new Error(t('auth.register.emailTaken'));
        if (data.error === 'Username is taken') throw new Error(t('auth.register.usernameTaken'));
        if (data.error === 'Invalid data') throw new Error(t('auth.register.invalidData'));
        throw new Error(data.error || data.message || "Registration failed");
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
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>{t('auth.register.title')}</h2>
        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", color: "#EF4444", fontSize: "0.85rem" }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Input label={t('auth.register.username')} value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
          <Input label={t('auth.register.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label={t('auth.register.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <Input label={t('auth.register.confirm')} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button variant="purple" type="submit" disabled={loading}>{loading ? "..." : t('auth.register.submit')}</Button>
        </form>
        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem", color: "var(--text-dim)" }}>
          {t('auth.register.hasAccount')} <Link to="/login">{t('auth.register.login')}</Link>
        </p>
      </GlassCard>
    </div>
  );
};

export default RegisterPage;