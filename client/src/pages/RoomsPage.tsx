import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { useTranslation } from "../i18n/LanguageContext";
import JoinRoomModal from "../components/room/JoinRoomModal";

interface RoomItem {
  id: string;
  name: string;
  inviteCode: string;
  viewers: number;
  host: string;
  isPrivate?: boolean;
}

const getGuestId = () => {
  let id = sessionStorage.getItem("guestId");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem("guestId", id);
  }
  return id;
};

const RoomsPage = () => {
  const [tab, setTab] = useState<"active"|"planned">("active");
  const [showCreate, setShowCreate] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [joinModal, setJoinModal] = useState(false);
  const [joinRoomData, setJoinRoomData] = useState<{ code: string; isPrivate: boolean } | null>(null);

  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");

  const [planTitle, setPlanTitle] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planTime, setPlanTime] = useState("");
  const [planUrl, setPlanUrl] = useState("");

  const token = localStorage.getItem("token");
  const guestId = getGuestId();

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

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/events');
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch {}
  };

  const handleCreate = async () => {
    if (!token) {
      alert(t('rooms.createModal.guestError'));
      setShowCreate(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: roomName || "New Room",
          isPrivate: isPrivate,
          password: isPrivate ? roomPassword : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setRoomName("");
        setIsPrivate(false);
        setRoomPassword("");
        navigate("/room/" + data.room.inviteCode);
      }
    } catch {
      setShowCreate(false);
      navigate("/room/room-" + Date.now());
    }
  };

  const handleJoinRoom = async (code: string, password?: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, guestId: !token ? guestId : undefined }),
      });
      if (res.ok) {
        setJoinModal(false);
        navigate(`/room/${code}`);
      } else {
        const data = await res.json();
        if (res.status === 403 && data.error === 'You are banned from this room') {
          alert(t('room.banned'));
        } else {
          alert(data.error || 'Cannot join room');
        }
      }
    } catch {
      alert(t('error.network'));
    }
  };

  const handlePlanSubmit = async () => {
    if (!token) {
      alert(t('rooms.planModal.guestError') || 'Только зарегистрированные пользователи могут планировать события');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: planTitle || 'Untitled Event',
          videoUrl: planUrl || '',
          scheduledAt: new Date(`${planDate}T${planTime}`).toISOString(),
        }),
      });
      if (res.ok) {
        setShowPlan(false);
        setPlanTitle("");
        setPlanDate("");
        setPlanTime("");
        setPlanUrl("");
        fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при создании события');
      }
    } catch {
      alert(t('error.network'));
    }
  };

  return (
    <div className="container" style={{ paddingTop: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", gap: "24px" }}>
          {(["active", "planned"] as const).map((tb) => (
            <button key={tb} onClick={() => {
              setTab(tb);
              if (tb === 'planned') fetchEvents();
            }} style={{ background: "none", border: "none", color: tab === tb ? "#fff" : "var(--text-dim)", fontSize: "1.1rem", cursor: "pointer", paddingBottom: "6px", borderBottom: tab === tb ? "2px solid var(--accent-purple)" : "2px solid transparent" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", padding: "20px" }}>
          {rooms.length === 0 && <p style={{ color: "var(--text-dim)", gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>{t('rooms.noRooms')}</p>}
          {rooms.map((room) => (
            <GlassCard key={room.id} style={{ padding: "24px" }}>
              <span style={{ fontSize: "0.8rem", color: room.isPrivate ? "var(--accent-purple)" : "var(--accent-green)" }}>
                {room.isPrivate ? t('rooms.private') : `${room.viewers} ${t('rooms.viewers')}`}
              </span>
              <h3 style={{ margin: "10px 0" }}>{room.name}</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: "16px" }}>{t('rooms.host')} {room.host}</p>
              <Button variant="outline" onClick={() => {
                if (room.isPrivate) {
                  setJoinRoomData({ code: room.inviteCode, isPrivate: true });
                  setJoinModal(true);
                } else {
                  handleJoinRoom(room.inviteCode);
                }
              }} style={{ width: "100%" }}>{t('rooms.join')}</Button>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", padding: "20px" }}>
          {events.length === 0 ? (
            <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "60px", gridColumn: "1 / -1" }}>{t('rooms.noPlanned')}</p>
          ) : (
            events.map((event: any) => (
              <GlassCard key={event.id} style={{ padding: "24px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--accent-blue)" }}>
                  📅 {new Date(event.scheduledAt).toLocaleDateString()} {new Date(event.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <h3 style={{ margin: "10px 0" }}>{event.title}</h3>
                <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: "16px" }}>
                  {event.creator?.username && `${t('rooms.host')} ${event.creator.username}`}
                </p>
                {event.room?.inviteCode && (
                  <Button variant="outline" onClick={() => navigate("/room/" + event.room.inviteCode)} style={{ width: "100%" }}>
                    {t('rooms.join')}
                  </Button>
                )}
              </GlassCard>
            ))
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('rooms.createModal.title')}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label={t('rooms.createModal.name')} value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder={t('rooms.createModal.namePlaceholder')} />
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} style={{ accentColor: "var(--accent-purple)" }} />
            {t('rooms.createModal.private')}
          </label>
          {isPrivate && (
            <Input label={t('rooms.createModal.password')} type="password" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} placeholder="Минимум 4 символа" />
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>{t('rooms.createModal.cancel')}</Button>
            <Button variant="primary" onClick={handleCreate} style={{ flex: 2 }}>{t('rooms.createModal.submit')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPlan} onClose={() => setShowPlan(false)} title={t('rooms.planModal.title')}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label={t('rooms.planModal.name')} value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} placeholder={t('rooms.planModal.namePlaceholder')} />
          <div style={{ display: "flex", gap: "10px" }}>
            <Input label={t('rooms.planModal.date')} type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
            <Input label={t('rooms.planModal.time')} type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} />
          </div>
          <Input label={t('rooms.planModal.url')} value={planUrl} onChange={(e) => setPlanUrl(e.target.value)} placeholder="https://..." />
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline" onClick={() => setShowPlan(false)} style={{ flex: 1 }}>{t('rooms.planModal.cancel')}</Button>
            <Button variant="primary" onClick={handlePlanSubmit} style={{ flex: 2 }}>{t('rooms.planModal.submit')}</Button>
          </div>
        </div>
      </Modal>

      <JoinRoomModal
        isOpen={joinModal}
        onClose={() => setJoinModal(false)}
        onJoin={(password) => {
          if (joinRoomData) {
            handleJoinRoom(joinRoomData.code, password);
          }
        }}
        isPrivate={joinRoomData?.isPrivate || false}
      />
    </div>
  );
};

export default RoomsPage;