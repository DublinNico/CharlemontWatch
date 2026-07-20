import { useEffect, useRef } from "react";
import { Link } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PAGES = [
  { label: "Home", path: "/" },
  { label: "Report an Incident", path: "/report" },
  { label: "Track Your Report", path: "/track" },
  { label: "View All Incidents", path: "/incidents" },
  { label: "About Us", path: "/about" },
  { label: "Contact", path: "/contact" },
];

const styles = {
  footer: {
    width: "100%",
    background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#9333ea 100%)",
    color: "#ffffff",
    padding: "56px 72px 0",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr 1.2fr",
    gap: 56,
    alignItems: "start",
  },
  brandCol: { display: "flex", flexDirection: "column", gap: 18 },
  logoRow: { display: "flex", alignItems: "center", gap: 12 },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(255,255,255,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.2px" },
  brandSub: { fontSize: 12, color: "#d9d2ff" },
  blurb: { fontSize: 14, lineHeight: 1.6, color: "#e9e4ff", maxWidth: 360, margin: 0 },
  emailRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14 },
  emailLink: { fontWeight: 600, color: "#e9e4ff", textDecoration: "none" },
  fbBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "#ffffff",
    color: "#4f46e5",
    fontWeight: 700,
    fontSize: 14,
    padding: "10px 18px",
    borderRadius: 10,
    width: "fit-content",
    textDecoration: "none",
  },
  colTitle: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    color: "#d9d2ff",
    marginBottom: 16,
  },
  pageList: { display: "flex", flexDirection: "column", gap: 12, fontSize: 14 },
  pageLink: { color: "#e9e4ff", textDecoration: "none" },
  map: {
    width: "100%",
    height: 240,
    borderRadius: 14,
    border: "3px solid rgba(255,255,255,0.35)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  },
  mapCaption: { fontSize: 13, color: "#e9e4ff", marginTop: 10 },
  bottomBar: {
    marginTop: 48,
    borderTop: "1px solid rgba(255,255,255,0.25)",
    padding: "20px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    color: "#e9e4ff",
  },
};

export default function Footer() {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
    }).setView([53.3315, -6.2617], 16);
    map.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    L.circleMarker([53.3315, -6.2617], {
      radius: 9,
      color: "#ffffff",
      weight: 3,
      fillColor: "#7c3aed",
      fillOpacity: 1,
    }).addTo(map);
    return () => map.remove();
  }, []);

  return (
    <footer className="cw-footer" style={styles.footer}>
      <style>{`
        @media (max-width: 768px) {
          .cw-footer { padding-left: 24px !important; padding-right: 24px !important; }
          .cw-footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cw-footer-bottom-bar { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
        }
      `}</style>
      <div className="cw-footer-grid" style={styles.grid}>
        {/* Brand + contact */}
        <div style={styles.brandCol}>
          <div style={styles.logoRow}>
            <div style={styles.logoBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
              </svg>
            </div>
            <div>
              <div style={styles.brandName}>CharlemontWatch</div>
              <div style={styles.brandSub}>Community Safety Platform</div>
            </div>
          </div>
          <p style={styles.blurb}>
            Building a safer Charlemont Street through community reporting and
            formal complaints to Túath Housing and Dublin City Council.
          </p>
          <div style={styles.emailRow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
            <a href="mailto:contact@charlemontwatch.ie" style={styles.emailLink}>
              contact@charlemontwatch.ie
            </a>
          </div>
          <a href="https://www.facebook.com/profile.php?id=61591822469519" target="_blank" rel="noreferrer" style={styles.fbBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#4f46e5">
              <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
            </svg>
            Follow us on Facebook
          </a>
        </div>

        {/* Pages */}
        <div>
          <div style={styles.colTitle}>Pages</div>
          <div style={styles.pageList}>
            {PAGES.map((page) => (
              <Link key={page.path} to={page.path} style={styles.pageLink}>
                {page.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Map */}
        <div>
          <div style={styles.colTitle}>Find Us</div>
          <div ref={mapRef} style={styles.map} />
          <div style={styles.mapCaption}>Charlemont Street, Dublin 2, Ireland</div>
        </div>
      </div>

      <div className="cw-footer-bottom-bar" style={styles.bottomBar}>
        <div>© 2026 CharlemontWatch · Community Safety Platform</div>
        <Link to="/privacy" style={styles.pageLink}>Privacy Policy</Link>
      </div>
    </footer>
  );
}
