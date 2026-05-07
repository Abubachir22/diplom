import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";

const Header = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/room/")) return null;

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,17,23,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--glass-border)", height: "var(--header-height)", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(to right, var(--accent-purple), var(--accent-blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SyncVibe</Link>
        <nav style={{ display: "flex", gap: "10px" }}>
          <Link to="/rooms"><Button variant="outline" size="sm">Rooms</Button></Link>
          <Link to="/login"><Button variant="outline" size="sm">Login</Button></Link>
          <Link to="/register"><Button variant="purple" size="sm">Sign Up</Button></Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
