import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { ReportIncident } from "./pages/ReportIncident";
import { ReportSuccess } from "./pages/ReportSuccess";
import { TrackReport } from "./pages/TrackReport";
import { AllIncidents } from "./pages/AllIncidents";
import { About } from "./pages/About";
import { Auth } from "./pages/Auth";
import { AdminDashboard } from "./pages/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/report",
    element: <ReportIncident />,
  },
  {
    path: "/success/:id",
    element: <ReportSuccess />,
  },
  {
    path: "/track",
    element: <TrackReport />,
  },
  {
    path: "/incidents",
    element: <AllIncidents />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
]);
