import { Link } from "@tanstack/react-router";

export function HomeFooter() {
  return (
    <footer className="gp-footer">
      <div className="gp-footer-inner">
        <div className="gp-footer-brand">
          <span className="gp-footer-name">Geo Pin Properties</span>
          <span className="gp-footer-tag">find. connect. own.</span>
        </div>
        <div className="gp-footer-cols">
          <nav aria-label="Explore" className="gp-footer-col">
            <span>Explore</span>
            <Link to="/explore">Map</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/blog">Blog</Link>
          </nav>
          <nav aria-label="Company" className="gp-footer-col">
            <span>Company</span>
            <Link to="/about">About</Link>
            <Link to="/help">Help centre</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>
      </div>
      <div className="gp-footer-legal">© {new Date().getFullYear()} Geo Pin Properties Kenya</div>
    </footer>
  );
}
