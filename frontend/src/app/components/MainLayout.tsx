import { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router';
import Footer from './Footer.jsx';

// Layout route wrapper: resets scroll position to the top on every route
// change (React Router doesn't do this automatically for an SPA), and
// renders the shared Footer below every page's content via Outlet.
export function MainLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}
