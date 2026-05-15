import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import { useTranslation } from "../i18n/LanguageContext";

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="container" style={{ textAlign: "center", padding: "120px 20px" }}>
      <h1 style={{ fontSize: "5rem", color: "var(--accent-purple)", marginBottom: "8px" }}>404</h1>
      <p style={{ color: "var(--text-dim)", fontSize: "1.2rem", marginBottom: "30px" }}>{t('404.title')}</p>
      <Link to="/"><Button variant="purple">{t('404.button')}</Button></Link>
    </div>
  );
};

export default NotFoundPage;