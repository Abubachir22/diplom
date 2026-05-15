import React from "react";
import type { RoomParticipant } from "../../types";
import { useTranslation } from "../../i18n/LanguageContext";

interface ParticipantListProps {
  participants: RoomParticipant[];
  currentUserId: string;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, currentUserId }) => {
  const { t } = useTranslation();

  return (
    <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
      <h4 style={{ marginBottom: "4px", fontSize: "0.9rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px" }}>{t('room.participants')} ({participants.length})</h4>
      <div style={{ flex: 1, overflowY: "auto", marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {participants.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>{t('room.noParticipants')}</p>}
        {participants.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "10px", background: p.user.id === currentUserId ? "rgba(139,92,246,0.15)" : "transparent", fontSize: "0.9rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: p.role === "OWNER" ? "linear-gradient(135deg, var(--accent-purple), var(--accent-blue))" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>{p.user.username.charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{p.user.username}{p.user.id === currentUserId ? <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}> {t('room.you')}</span> : ""}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{p.role === "OWNER" ? t('room.host') : t('room.viewer')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantList;