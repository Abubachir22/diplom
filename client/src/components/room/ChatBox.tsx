import React, { useState, useRef, useEffect } from "react";
import type { Message } from "../../types";
import MessageBubble from "./MessageBubble";
import { useTranslation } from "../../i18n/LanguageContext";

interface ChatBoxProps {
  messages: Message[];
  currentUserId: string;
  onSend: (text: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, currentUserId, onSend }) => {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) { onSend(text.trim()); setText(""); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.length === 0 && <p style={{ color: "var(--text-dim)", textAlign: "center", fontSize: "0.85rem", marginTop: "20px" }}>{t('room.chat.empty')}</p>}
        {messages.map((m) => <MessageBubble key={m.id} message={m} isOwn={m.userId === currentUserId} />)}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} style={{ padding: "12px 16px", borderTop: "1px solid var(--glass-border)", display: "flex", gap: "8px" }}>
        <input className="input" placeholder={t('room.chat.placeholder')} value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1, padding: "10px 14px", fontSize: "0.9rem" }} maxLength={500} />
        <button type="submit" className="btn btn-purple btn-sm" disabled={!text.trim()} style={{ padding: "10px 14px" }}>{t('room.chat.send')}</button>
      </form>
    </div>
  );
};

export default ChatBox;