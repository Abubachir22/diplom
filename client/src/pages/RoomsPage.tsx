import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { useTranslation } from "../i18n/LanguageContext";

interface RoomItem {
  id: string;
  name: string;
  inviteCode: string;
  viewers: number;
  host: string;
  isPrivate?: boolean;
}

const RoomsPage = () => {
  const [tab, setTab] = useState<"active"|"planned">("active");
  const [showCreate, setShowCreate] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetch("http://localhost:5000/api/rooms")
      .then((r) => r.json())
      .then((d) => { if (d.rooms) setRooms(d.rooms); })
      .catch(() => {
        setRooms([
          { id: "abc", name: "Meme Night 2026", inviteCode: "abc", viewers: 5, host: "Admin_Giga" },
          { id: "def", name: "Movie for Two", inviteCode: "def", viewers: 2, host: "Elena_V", isPrivate: true },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        body: JSON.stringify({ name: roomName || "New Room", isPrivate: false }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        navigate("/room/" + data.room.inviteCode);
      }
    } catch {
      setShowCreate(false);
      navigate("/room/room-" + Date.now());
    }
  };

  return (
    <div className="container" style={{ paddingTop: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", gap: "24px" }}>
          {(["active", "planned"] as const).map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} style={{ background: "none", border: "none", color: tab === tb ? "#fff" : "var(--text-dim)", fontSize: "1.1rem", cursor: "pointer", paddingBottom: "6px", borderBottom: tab === tb ? "2px solid var(--accent-purple)" : "2px solid transparent" }}>
              {tb === "active" ? t('rooms.active') : t('rooms.planned')}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="outline" size="sm" onClick={() => setShowPlan(true)}>{t('rooms.plan')}</Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>{t('rooms.create')}</Button>
        </div>
      </div>

      {loading ? <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "60px 0" }}>Loading...</p>
      : tab === "active" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {rooms.length === 0 && <p style={{ color: "var(--text-dim)", gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>{t('rooms.noRooms')}</p>}
          {rooms.map((room) => (
            <GlassCard key={room.id} style={{ padding: "24px" }}>
              <span style={{ fontSize: "0.8rem", color: room.isPrivate ? "var(--accent-purple)" : "var(--accent-green)" }}>
                {room.isPrivate ? t('rooms.private') : `${room.viewers} ${t('rooms.viewers')}`}
              </span>
              <h3 style={{ margin: "10px 0" }}>{room.name}</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: "16px" }}>{t('rooms.host')} {room.host}</p>
              <Button variant="outline" onClick={() => navigate("/room/" + room.inviteCode)} style={{ width: "100%" }}>{t('rooms.join')}</Button>
            </GlassCard>
          ))}
        </div>
      ) : <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "60px" }}>{t('rooms.noPlanned')}</p>}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('rooms.createModal.title')}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label={t('rooms.createModal.name')} value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder={t('rooms.createModal.namePlaceholder')} />
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>{t('rooms.createModal.cancel')}</Button>
            <Button variant="primary" onClick={handleCreate} style={{ flex: 2 }}>{t('rooms.createModal.submit')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPlan} onClose={() => setShowPlan(false)} title={t('rooms.planModal.title')}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label={t('rooms.planModal.name')} placeholder={t('rooms.planModal.namePlaceholder')} />
          <div style={{ display: "flex", gap: "10px" }}>
            <Input label={t('rooms.planModal.date')} type="date" />
            <Input label={t('rooms.planModal.time')} type="time" />
          </div>
          <Input label={t('rooms.planModal.url')} placeholder="https://..." />
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline" onClick={() => setShowPlan(false)} style={{ flex: 1 }}>{t('rooms.planModal.cancel')}</Button>
            <Button variant="primary" onClick={() => setShowPlan(false)} style={{ flex: 2 }}>{t('rooms.planModal.submit')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomsPage;