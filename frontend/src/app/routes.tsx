import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { ReportIncident } from "./pages/ReportIncident";
import { ReportSuccess } from "./pages/ReportSuccess";
import { TrackReport } from "./pages/TrackReport";
import { AllIncidents } from "./pages/AllIncidents";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Auth } from "./pages/Auth";
import { AdminDashboard } from "./pages/AdminDashboard";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsAndConditions } from "./pages/TermsAndConditions";
import { NotFound } from "./pages/NotFound";
import { MainLayout } from "./components/MainLayout";

// All app routes. MainLayout wraps every page: resets scroll position on
// navigation and renders the shared Footer; "*" is the catch-all 404.
export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/report", element: <ReportIncident /> },
      { path: "/success/:id", element: <ReportSuccess /> },
      { path: "/track", element: <TrackReport /> },
      { path: "/incidents", element: <AllIncidents /> },
      { path: "/about", element: <About /> },
      { path: "/contact", element: <Contact /> },
      { path: "/cw-admin", element: <Auth /> },
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/privacy", element: <PrivacyPolicy /> },
      { path: "/terms", element: <TermsAndConditions /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
