import { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router';
import Footer from './Footer.jsx';

// Layout route wrapper: resets scroll position to the top (or to the #hash
// target) on every route change (React Router doesn't do this for an SPA), and
// renders the shared Footer below every page's content via Outlet.
export function MainLayout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Links like /#vote jump to that section (the browser can't do it itself
    // because the content renders after load); anything else starts at the top
    let target: HTMLElement | null = null;
    if (hash) {
      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        // Malformed percent-encoding (e.g. /#%E0) — treat as no target
      }
    }
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    // Column layout so short pages (Contact, 404, login) push the footer to
    // the bottom of the viewport without padding the page itself
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
