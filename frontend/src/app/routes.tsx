import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { ReportIncident } from "./pages/ReportIncident";
import { ReportSuccess } from "./pages/ReportSuccess";
import { TrackReport } from "./pages/TrackReport";
import { AllIncidents } from "./pages/AllIncidents";
import { About } from "./pages/About";
import { Auth } from "./pages/Auth";
import { AdminDashboard } from "./pages/AdminDashboard";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { NotFound } from "./pages/NotFound";
import { ScrollToTop } from "./components/ScrollToTop";

// All app routes. ScrollToTop wraps every page so navigating between routes
// always lands at the top of the page; "*" is the catch-all 404.
export const router = createBrowserRouter([
  {
    element: <ScrollToTop />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/report", element: <ReportIncident /> },
      { path: "/success/:id", element: <ReportSuccess /> },
      { path: "/track", element: <TrackReport /> },
      { path: "/incidents", element: <AllIncidents /> },
      { path: "/about", element: <About /> },
      { path: "/cw-admin", element: <Auth /> },
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/privacy", element: <PrivacyPolicy /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
