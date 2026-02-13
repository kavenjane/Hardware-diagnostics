import { useNavigate, useLocation } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => navigate("/")}>
          <span className="logo-icon">⚙️</span>
          <span className="logo-text">Hardware Diagnostics</span>
        </div>

        <nav className="nav">
          <a href="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>
            Home
          </a>
          <a href="/dashboard" className={location.pathname === "/dashboard" ? "nav-link active" : "nav-link"}>
            Dashboard
          </a>
          <a href="#" className="nav-link">
            Docs
          </a>
          <a href="#" className="nav-link">
            Support
          </a>
          <button className="btn-header">
            ⭐ Star on GitHub
          </button>
        </nav>
      </div>
    </header>
  );
}
