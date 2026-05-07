import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", style, onClick }) => (
  <div className={"glass-card " + className} style={style} onClick={onClick}>
    {children}
  </div>
);

export default GlassCard;
