import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

const NotFoundPage = () => (
  <div className="container" style={{ textAlign: "center", padding: "120px 20px" }}>
    <h1 style={{ fontSize: "5rem", color: "var(--accent-purple)", marginBottom: "8px" }}>404</h1>
    <p style={{ color: "var(--text-dim)", fontSize: "1.2rem", marginBottom: "30px" }}>Page not found</p>
    <Link to="/"><Button variant="purple">Go Home</Button></Link>
  </div>
);

export default NotFoundPage;
