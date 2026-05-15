import { useLocation } from "react-router-dom";
import { useTranslation } from "../../i18n/LanguageContext";

const Footer = () => {
  const location = useLocation();
  const { t } = useTranslation();
  if (location.pathname.startsWith("/room/")) return null;
  return (
    <footer style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem", borderTop: "1px solid var(--glass-border)", marginTop: "auto" }}>
      <p>{t('footer.text')}</p>
    </footer>
  );
};

export default Footer;