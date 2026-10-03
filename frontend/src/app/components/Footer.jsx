import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Shield, Mail, Facebook, MapPin, Siren } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const REPORT_LINKS = [
  { label: "Report an incident", path: "/report" },
  { label: "Track your report", path: "/track" },
  { label: "All incidents", path: "/incidents" },
];

const SITE_LINKS = [
  { label: "Home", path: "/" },
  { label: "About us", path: "/about" },
  { label: "Contact", path: "/contact" },
];

const LINK_CLASS = "text-muted-foreground hover:text-foreground transition-colors";

export default function Footer() {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
    }).setView([53.3315, -6.2617], 16);
    map.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    // Marker uses the theme's primary colour so it tracks light/dark mode
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#1d4ed8";
    L.circleMarker([53.3315, -6.2617], {
      radius: 9,
      color: "#ffffff",
      weight: 3,
      fillColor: accent,
      fillOpacity: 1,
    }).addTo(map);
    return () => map.remove();
  }, []);

  return (
    <footer className="mt-16 md:mt-20 border-t border-border bg-card text-sm text-muted-foreground">
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-[1.35fr_0.65fr_0.65fr_1.35fr] gap-x-6 gap-y-9 lg:gap-12 pt-12 lg:pt-16">
          {/* Brand + contact */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-[18px]">
            <div className="flex items-center gap-2.5 text-foreground">
              <span className="size-[34px] rounded-md bg-foreground text-background grid place-items-center">
                <Shield className="size-[19px]" strokeWidth={2.25} />
              </span>
              <div>
                <div className="text-lg font-bold tracking-[-0.02em] leading-tight">CharlemontWatch</div>
                <div className="text-[12.5px] font-medium text-subtle-foreground">Community Safety Platform</div>
              </div>
            </div>
            <p className="leading-relaxed max-w-[36ch] m-0">
              Building a safer Charlemont Street through community reporting and
              formal complaints to Túath Housing and Dublin City Council.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="mailto:contact@charlemontwatch.ie"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-foreground font-semibold hover:bg-background transition-colors"
              >
                <Mail className="size-4" />
                contact@charlemontwatch.ie
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61591822469519"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-foreground font-semibold hover:bg-background transition-colors"
              >
                <Facebook className="size-4" />
                Facebook
              </a>
            </div>
          </div>

          {/* Pages */}
          <nav aria-label="Reports">
            <div className="text-sm font-semibold text-foreground mb-3.5">Reports</div>
            <div className="grid gap-2.5">
              {REPORT_LINKS.map((page) => (
                <Link key={page.path} to={page.path} className={LINK_CLASS}>{page.label}</Link>
              ))}
            </div>
          </nav>
          <nav aria-label="Site">
            <div className="text-sm font-semibold text-foreground mb-3.5">Site</div>
            <div className="grid gap-2.5">
              {SITE_LINKS.map((page) => (
                <Link key={page.path} to={page.path} className={LINK_CLASS}>{page.label}</Link>
              ))}
            </div>
          </nav>

          {/* Map */}
          <div className="col-span-2 lg:col-span-1">
            <div
              ref={mapRef}
              className="footer-map w-full h-[200px] rounded-lg border border-border overflow-hidden bg-muted"
              aria-label="Map of Charlemont Street"
            />
            <div className="mt-2.5 flex items-center gap-1.5 text-[13px]">
              <MapPin className="size-3.5 text-primary" />
              Charlemont Street, Dublin 2, Ireland
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-border py-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3 text-[13px] text-subtle-foreground">
          <div>© 2026 CharlemontWatch</div>
          <div className="inline-flex items-center gap-1.5">
            <Siren className="size-3.5 text-destructive" />
            Emergency? Call 999 or 112.
          </div>
          <div className="flex gap-5">
            <Link to="/privacy" className={LINK_CLASS}>Privacy policy</Link>
            <Link to="/terms" className={LINK_CLASS}>Terms and conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
