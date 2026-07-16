import * as Sentry from '@sentry/react';
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Client-side error monitoring — only active when VITE_SENTRY_DSN is set
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
}

// App entry point — mounts the React tree into the #root element
createRoot(document.getElementById("root")!).render(<App />);
