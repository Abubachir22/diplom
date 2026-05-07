import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) { document.addEventListener("keydown", handleEsc); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEsc); document.body.style.overflow = ""; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "480px", padding: "32px" }}>
        {title && <h3 style={{ marginBottom: "24px" }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
