import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";

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
          {(["active", "planned"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#fff" : "var(--text-dim)", fontSize: "1.1rem", cursor: "pointer", paddingBottom: "6px", borderBottom: tab === t ? "2px solid var(--accent-purple)" : "2px solid transparent" }}>
              {/* {t === "active" ? "Active Rooms" : "Planned"} */}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {/* <Button variant="outline" size="sm" onClick={() => setShowPlan(true)}>+ Plan</Button> */}
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ Create Room</Button>
        </div>
      </div>

      {loading ? <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "60px 0" }}>Loading...</p>
      : tab === "active" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {rooms.map((room) => (
            <GlassCard key={room.id} style={{ padding: "24px" }}>
              <span style={{ fontSize: "0.8rem", color: room.isPrivate ? "var(--accent-purple)" : "var(--accent-green)" }}>
                {room.isPrivate ? "Private" : room.viewers + " watching"}
              </span>
              <h3 style={{ margin: "10px 0" }}>{room.name}</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: "16px" }}>Host: {room.host}</p>
              <Button variant="outline" onClick={() => navigate("/room/" + room.inviteCode)} style={{ width: "100%" }}>Join</Button>
            </GlassCard>
          ))}
        </div>
      ) : <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "60px" }}>No planned events yet</p>}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Room">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Room Name" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Friday Movie Night" />
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline" onClick={() => setShowCreate(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} style={{ flex: 2 }}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPlan} onClose={() => setShowPlan(false)} title="Schedule Event">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Event Name" placeholder="Season Finale" />
          <div style={{ display: "flex", gap: "10px" }}>
            <Input label="Date" type="date" />
            <Input label="Time" type="time" />
          </div>
          <Input label="Video Link" placeholder="https://..." />
          <div style={{ display: "flex", gap: "10px" }}>
            <Button variant="outline" onClick={() => setShowPlan(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="primary" onClick={() => setShowPlan(false)} style={{ flex: 2 }}>Create Event</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomsPage;
