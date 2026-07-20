import { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router';
import Footer from './Footer.jsx';

// Layout route wrapper: resets scroll position to the top on every route
// change, since React Router doesn't do this automatically for an SPA
export function ScrollToTop() {
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
