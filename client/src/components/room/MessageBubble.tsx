import React from "react";
import type { Message } from "../../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  if (message.isSystem) {
    return <div style={{ textAlign: "center", padding: "4px 0", fontSize: "0.8rem", color: "var(--text-dim)", fontStyle: "italic" }}>{message.text}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", gap: "2px" }}>
      {!isOwn && <span style={{ fontSize: "0.7rem", color: "var(--accent-purple)", paddingLeft: "4px" }}>{message.username}</span>}
      <div style={{ maxWidth: "80%", padding: "8px 14px", borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isOwn ? "var(--accent-purple)" : "rgba(255,255,255,0.08)", fontSize: "0.85rem", wordBreak: "break-word" }}>{message.text}</div>
      <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", padding: "0 4px" }}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
    </div>
  );
};

export default MessageBubble;
