import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";
import Input from "../components/ui/Input";

const HomePage = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => { if (code.trim()) navigate("/room/" + code.trim()); };

  return (
    <div className="container">
      <section style={{ textAlign: "center", padding: "80px 0 60px" }}>
        <h1>Watch videos together,<br /><span style={{ color: "var(--accent-blue)" }}>even miles apart</span></h1>
        <p style={{ color: "var(--text-dim)", fontSize: "1.15rem", maxWidth: "600px", margin: "20px auto 40px" }}>
          First platform with full support for Rutube and YouTube. Sync player, chat and.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/rooms"><Button variant="primary">Create Room</Button></Link>
          <div style={{ display: "flex", gap: "8px" }}>
            <Input placeholder="Invite code..." value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleJoin()} style={{ width: "200px" }} />
            <Button variant="outline" onClick={handleJoin}>Join</Button>
          </div>
        </div>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "60px" }}>
        {[
          { icon: "V", title: "All Services", desc: "YouTube and Rutube in one place." },
          { icon: "S", title: "Scheduler", desc: "Plan events ahead and send reminders to friends." },
          // { icon: "P", title: "Privacy", desc: "Guest login or private rooms with password." }
        ].map((f) => (
          <GlassCard key={f.title} style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p style={{ color: "var(--text-dim)", marginTop: "8px" }}>{f.desc}</p>
          </GlassCard>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
