import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    // Strip PII (email, name, form-data)
    if (event.request && event.request.data) {
      try {
        const data = typeof event.request.data === 'string' 
          ? JSON.parse(event.request.data) 
          : { ...event.request.data };
          
        if (data.email) data.email = "[Filtered]";
        if (data.name) data.name = "[Filtered]";
        if (data.fullName) data.fullName = "[Filtered]";
        if (data.message) data.message = "[Filtered]";
        
        event.request.data = typeof event.request.data === 'string' 
          ? JSON.stringify(data) 
          : data;
      } catch (e) {
        event.request.data = "[Filtered payload]";
      }
    }
    
    if (event.user) {
      if (event.user.email) event.user.email = "[Filtered]";
      if (event.user.username) event.user.username = "[Filtered]";
    }
    
    return event;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
