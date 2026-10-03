import { useEffect, useState } from 'react';
import { Shield, LogOut, Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';

const NAV_LINKS = [
  { label: 'All incidents', to: '/incidents' },
  { label: 'Track a report', to: '/track' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

// Site-wide top nav: logo/home link, page links, the Report CTA, and (when
// logged in) the admin Dashboard/Sign Out controls. Below md the page links
// move into a toggleable menu panel.
export function Header() {
  const { isAuthenticated, logout, user } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground transition-colors';

  return (
    <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="page-container h-[68px] flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="CharlemontWatch home">
          <span className="size-[34px] rounded-md bg-foreground text-background grid place-items-center">
            <Shield className="size-[19px]" strokeWidth={2.25} />
          </span>
          <h1 className="text-base md:text-lg font-bold tracking-[-0.02em] leading-none">CharlemontWatch</h1>
        </Link>

        <nav className="flex items-center gap-2 md:gap-7 text-[15px]" aria-label="Main">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} className={state => `hidden md:inline ${linkClass(state)}`}>
              {link.label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden lg:inline">{user?.name}</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')} aria-label="Dashboard">
                <Shield className="size-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive"
                aria-label="Sign Out"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/report')}>
              <span className="sm:hidden">Report</span>
              <span className="hidden sm:inline">Report an incident</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            className="md:hidden size-9"
            onClick={() => setMenuOpen(open => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </Button>
        </nav>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-border bg-background">
          <nav className="px-4 py-3 grid" aria-label="Mobile">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `py-3 text-base border-b border-border last:border-0 ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
