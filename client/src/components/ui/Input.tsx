import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = "", ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    {label && <label style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>{label}</label>}
    <input className={"input " + className} {...props} />
    {error && <span style={{ fontSize: "0.75rem", color: "#EF4444" }}>{error}</span>}
  </div>
);

export default Input;
