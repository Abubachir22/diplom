import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import { useTranslation } from "../../i18n/LanguageContext";

const Header = () => {
  const location = useLocation();
  const { t, toggleLang } = useTranslation();

  if (location.pathname.startsWith("/room/")) return null;

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,17,23,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--glass-border)", height: "var(--header-height)", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(to right, var(--accent-purple), var(--accent-blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SyncVibe</Link>
        <nav style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link to="/rooms"><Button variant="outline" size="sm">{t('nav.rooms')}</Button></Link>
          <Link to="/login"><Button variant="outline" size="sm">{t('nav.login')}</Button></Link>
          <Link to="/register"><Button variant="purple" size="sm">{t('nav.signup')}</Button></Link>
          <Button variant="outline" size="sm" onClick={toggleLang} style={{ fontSize: "0.75rem", padding: "6px 10px", minWidth: "40px" }}>
            {t('nav.language')}
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;