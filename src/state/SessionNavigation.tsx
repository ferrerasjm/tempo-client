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

export function SessionNavigationProvider({ children }: { children: ReactNode }) {
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
    <Context.Provider value={{ destination: sessionReturn(sessions.data || []), error: sessions.error, retry: sessions.reload }}>
      {children}
    </Context.Provider>
  );
}

export function BackLink({ fallbackTo, fallbackLabel, className = "" }: {
  fallbackTo: string;
  fallbackLabel: string;
  className?: string;
}) {
  return <Link className={className} to={fallbackTo}><span aria-hidden="true">{"\u2190"}</span> {fallbackLabel}</Link>;
}

export function PageNavigation({ to, label, className = "", backClassName = "", children }: {
  to: string;
  label: string;
  className?: string;
  backClassName?: string;
  children?: ReactNode;
}) {
  const { error, retry } = useContext(Context);
  return (
    <nav className={`page-back page-navigation ${className}`} aria-label="Page navigation">
      <BackLink fallbackTo={to} fallbackLabel={label} className={backClassName} />
      <div className="page-navigation-actions">
        {error && <button type="button" className="text-link" onClick={retry}>Retry Timer Link</button>}
        {children}
      </div>
    </nav>
  );
}
