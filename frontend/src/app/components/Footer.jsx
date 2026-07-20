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
    <footer className="w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white font-sans box-border px-6 md:px-[72px] pt-14 pb-0">
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr_1.2fr] gap-10 md:gap-14 items-start">
        {/* Brand + contact */}
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/[0.18] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold tracking-[-0.2px]">CharlemontWatch</div>
              <div className="text-xs text-[#d9d2ff]">Community Safety Platform</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-[#e9e4ff] max-w-[360px] m-0">
            Building a safer Charlemont Street through community reporting and
            formal complaints to Túath Housing and Dublin City Council.
          </p>
          <div className="flex items-center gap-2.5 text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
            <a href="mailto:contact@charlemontwatch.ie" className="font-semibold text-[#e9e4ff] no-underline">
              contact@charlemontwatch.ie
            </a>
          </div>
          <a href="https://www.facebook.com/profile.php?id=61591822469519" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 bg-white text-indigo-600 font-bold text-sm px-[18px] py-2.5 rounded-[10px] w-fit no-underline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#4f46e5">
              <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
            </svg>
            Follow us on Facebook
          </a>
        </div>

        {/* Pages */}
        <div>
          <div className="text-[13px] font-bold uppercase tracking-[1.2px] text-[#d9d2ff] mb-4">Pages</div>
          <div className="flex flex-col gap-3 text-sm">
            {PAGES.map((page) => (
              <Link key={page.path} to={page.path} className="text-[#e9e4ff] no-underline">
                {page.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Map */}
        <div>
          <div className="text-[13px] font-bold uppercase tracking-[1.2px] text-[#d9d2ff] mb-4">Find Us</div>
          <div ref={mapRef} className="w-full h-[240px] rounded-[14px] border-[3px] border-white/[0.35] shadow-[0_8px_24px_rgba(0,0,0,0.2)]" />
          <div className="text-[13px] text-[#e9e4ff] mt-2.5">Charlemont Street, Dublin 2, Ireland</div>
        </div>
      </div>

      <div className="mt-12 border-t border-white/[0.25] py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left text-[13px] text-[#e9e4ff]">
        <div>© 2026 CharlemontWatch · Community Safety Platform</div>
        <Link to="/privacy" className="text-[#e9e4ff] no-underline">Privacy Policy</Link>
      </div>
    </footer>
  );
}
