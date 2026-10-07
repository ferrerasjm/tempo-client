import { createContext, useContext, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCafe } from "./CafeContext";
import { useApi } from "../hooks/useApi";
import { cafeApi } from "../services/cafeApi";
import { sessionReturn } from "../utils/sessionReturn";

type SessionDestination = ReturnType<typeof sessionReturn>;
const Context = createContext<{
  destination: SessionDestination;
  error: string;
  retry: () => void;
}>({ destination: null, error: "", retry: () => {} });

// App back links use explicit parents. The current session is an independent
// escape route, refreshed on navigation and when returning from another tab.
export function SessionNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useCafe();
  const location = useLocation();
  const sessions = useApi(
    () => (user ? cafeApi.sessions(user._id) : Promise.resolve([])),
    [user?._id, location.key],
  );
  useEffect(() => {
    const refresh = () => sessions.reload();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [sessions.reload]);
  return (
    <Context.Provider
      value={{
        destination: sessionReturn(sessions.data || []),
        error: sessions.error,
        retry: sessions.reload,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function BackLink({
  fallbackTo,
  fallbackLabel,
  className = "",
  preferSession = false,
}: {
  fallbackTo: string;
  fallbackLabel: string;
  className?: string;
  preferSession?: boolean;
}) {
  const { destination } = useContext(Context);
  const session = preferSession ? destination : null;
  const to = session ? `/focus/${session.session._id}` : fallbackTo;
  const label = session
    ? session.label === "Return to Timer"
      ? "Back to Timer"
      : session.label
    : fallbackLabel;
  return (
    <Link className={className} to={to}>
      <span aria-hidden="true">{"\u2190"}</span> {label}
    </Link>
  );
}

export function PageNavigation({
  to,
  label,
  preferSession = false,
  className = "",
  backClassName = "",
  children,
}: {
  to: string;
  label: string;
  preferSession?: boolean;
  className?: string;
  backClassName?: string;
  children?: ReactNode;
}) {
  const { destination, error, retry } = useContext(Context);
  const sessionHref = destination ? `/focus/${destination.session._id}` : null;
  return (
    <nav
      className={`page-back page-navigation ${className}`}
      aria-label="Page navigation"
    >
      <BackLink
        fallbackTo={to}
        fallbackLabel={label}
        preferSession={preferSession}
        className={backClassName}
      />
      <div className="page-navigation-actions">
        {sessionHref && !preferSession && sessionHref !== to && (
          <Link className="session-return-button" to={sessionHref}>
            {destination!.label}
          </Link>
        )}
        {error && (
          <button type="button" className="text-link" onClick={retry}>
            Retry Timer Link
          </button>
        )}
        {children}
      </div>
    </nav>
  );
}
