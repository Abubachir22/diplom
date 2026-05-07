import { useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/room/")) return null;

  return (
    <footer style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem", borderTop: "1px solid var(--glass-border)", marginTop: "auto" }}>
      <p>2026 SyncVibe. Made for movie lovers.</p>
    </footer>
  );
};

export default Footer;
