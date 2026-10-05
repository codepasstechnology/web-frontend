import { Link } from "@tanstack/react-router";

export function HomeFooter() {
  return (
    <footer className="gp-footer">
      <div className="gp-footer-inner">
        <span>© {new Date().getFullYear()} Geo Pin Properties Kenya · Find. Connect. Own.</span>
        <div className="gp-footer-links">
          <Link to="/about">About</Link>
          <a href="#statement">Verification</a>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
