import { useEffect, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import {
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useCafe } from "../state/CafeContext";
import { LoadState } from "./ui";
import { Modal } from "./Modal";
import { useApi } from "../hooks/useApi";
import { cafeApi } from "../services/cafeApi";
import { errorMessage } from "../api/http";
import { IconTooltips } from "./IconTooltips";
import { SessionNavigationProvider } from "../state/SessionNavigation";
import { sessionReturn } from "../utils/sessionReturn";
import { FocusMusicProvider } from "../state/FocusMusicContext";

export function Layout() {
  const { user, leave, notice, notify, exploreOpen, closeExplore } = useCafe();
  const navigate = useNavigate();
  const [pausingForNavigation, setPausingForNavigation] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const focus = useApi(
    () =>
      (menuOpen || exploreOpen) && user
        ? cafeApi.sessions(user._id)
        : Promise.resolve([]),
    [menuOpen, exploreOpen, user?._id, location.pathname],
  );
  const returnContext = sessionReturn(focus.data || []);
  const unfinished =
    returnContext?.label !== "Return to Session"
      ? returnContext?.session
      : null;
  function closeMenu() {
    setMenuOpen(false);
    closeExplore();
  }
  async function navigateFromExplore(
    event: MouseEvent<HTMLAnchorElement>,
    to: string,
  ) {
    event.preventDefault();
    if (pausingForNavigation) return;
    setPausingForNavigation(true);
    try {
      const sessions = user ? await cafeApi.sessions(user._id) : [];
      const active = sessions.find((item) => item.status === "active");
      if (active) {
        await cafeApi.sessionAction(active._id, "pause", active.area);
      }
      closeMenu();
      navigate(to, to === "/orders" ? { state: { from: "focus" } } : undefined);
    } catch (reason) {
      notify("Could not pause your focus timer. " + errorMessage(reason));
    } finally {
      setPausingForNavigation(false);
    }
  }
  useEffect(() => {
    setMenuOpen(false);
    closeExplore();
    window.scrollTo({ top: 0 });
  }, [location.pathname, location.search]);
  const session = /^\/focus\/[^/]+$/.test(location.pathname);
  const paper =
    ["/welcome", "/focus", "/menu", "/order-summary"].includes(
      location.pathname,
    ) || location.pathname.startsWith("/study/");
  const landing = location.pathname === "/";
  return (
    <div
      className={`app-shell ${landing ? "landing-shell" : session ? "session-shell" : paper ? "paper-shell" : "notebook-shell"}${location.pathname === "/welcome" ? " welcome-shell" : ""}${location.pathname.startsWith("/study/") ? " drink-shell" : ""}${location.pathname === "/study/label" ? " counter-shell" : ""}${location.pathname === "/study/task" ? " table-shell" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Modal
        open={menuOpen || exploreOpen}
        title="Explore the Cafe"
        onClose={closeMenu}
      >
        <nav className="explore-nav" aria-label="Main navigation">
          <div>
            <p className="eyebrow">In the Cafe</p>
            {focus.loading ? (
              <p className="note" role="status">
                Checking Your Timer…
              </p>
            ) : focus.error ? (
              <p className="note" role="alert">
                Your Timer Could Not Be Checked.{" "}
                <button className="text-link" onClick={focus.reload}>
                  Retry
                </button>
              </p>
            ) : (
              <NavLink
                onClick={closeMenu}
                to={unfinished ? `/focus/${unfinished._id}` : "/study/drink"}
              >
                {unfinished ? "Return To Focus" : "Choose A Drink"}
              </NavLink>
            )}
            <NavLink
              onClick={(event) => void navigateFromExplore(event, "/menu")}
              to="/menu"
              aria-disabled={pausingForNavigation}
            >
              Reward Shop
            </NavLink>
          </div>
          <div>
            <p className="eyebrow">Your Notebook</p>
            <NavLink
              onClick={(event) => void navigateFromExplore(event, "/orders")}
              to="/orders"
              aria-disabled={pausingForNavigation}
            >
              Your Orders
            </NavLink>
            <NavLink
              onClick={(event) => void navigateFromExplore(event, "/history")}
              to="/history"
              aria-disabled={pausingForNavigation}
            >
              Focus History
            </NavLink>
            <NavLink
              onClick={(event) =>
                void navigateFromExplore(event, "/analytics")
              }
              to="/analytics"
              aria-disabled={pausingForNavigation}
            >
              Productivity Stats
            </NavLink>
          </div>
        </nav>
        <button
          className="text-link profile-link"
          type="button"
          onClick={async () => {
            closeMenu();
            try {
              await leave(() => {
                flushSync(() => navigate("/welcome", { replace: true }));
              });
            }
            catch (reason) { notify(errorMessage(reason)); }
          }}
        >
          Log Out
        </button>
      </Modal>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      <main id="main">
        <FocusMusicProvider>
        <SessionNavigationProvider>
          <Outlet />
        </SessionNavigationProvider>
        </FocusMusicProvider>
      </main>
      <IconTooltips />
    </div>
  );
}
export function ProfileGate() {
  const { user, loading, error, retry } = useCafe();
  if (loading || error)
    return (
      <section className="page">
        <LoadState loading={loading} error={error} retry={retry}>
          {null}
        </LoadState>
      </section>
    );
  return user ? <Outlet /> : <Navigate to="/welcome" replace />;
}
