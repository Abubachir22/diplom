import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";
import { useTranslation } from "../i18n/LanguageContext";

const HomePage = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleJoin = () => {
    if (code.trim()) navigate("/room/" + code.trim());
  };

  return (
    <div className="container">
      <section style={{ textAlign: "center", padding: "80px 0 60px" }}>
        <h1>
          {t('home.title')}<br />
          <span style={{ color: "var(--accent-blue)" }}>{t('home.subtitle')}</span>
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: "1.15rem", maxWidth: "600px", margin: "20px auto 40px" }}>
          {t('home.desc')}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/rooms"><Button variant="primary">{t('home.createRoom')}</Button></Link>
          <div style={{ display: "flex", gap: "8px" }}>
            <Input placeholder={t('home.inviteCode')} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleJoin()} style={{ width: "200px" }} />
            <Button variant="outline" onClick={handleJoin}>{t('home.join')}</Button>
          </div>
        </div>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "60px" }}>
        <GlassCard style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}></div>
          <h3>{t('home.feature1.title')}</h3>
          <p style={{ color: "var(--text-dim)", marginTop: "8px" }}>{t('home.feature1.desc')}</p>
        </GlassCard>
        <GlassCard style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}></div>
          <h3>{t('home.feature2.title')}</h3>
          <p style={{ color: "var(--text-dim)", marginTop: "8px" }}>{t('home.feature2.desc')}</p>
        </GlassCard>
        <GlassCard style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}></div>
          <h3>{t('home.feature3.title')}</h3>
          <p style={{ color: "var(--text-dim)", marginTop: "8px" }}>{t('home.feature3.desc')}</p>
        </GlassCard>
      </section>
    </div>
  );
};

export default HomePage;