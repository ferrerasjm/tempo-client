import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CafeProvider } from "./state/CafeContext";
import { StudyDraftProvider } from "./state/StudyDraftContext";
import { ConfirmationProvider } from "./state/ConfirmationContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";
import "./experience.css";
import "./entrance.css";
import "./study.css";
import "./focus-room.css";
import "./sip-stats.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CafeProvider>
          <StudyDraftProvider>
            <ConfirmationProvider>
              <App />
            </ConfirmationProvider>
          </StudyDraftProvider>
        </CafeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
