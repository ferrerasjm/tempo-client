import { startTransition, useEffect, useState, type MouseEvent } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useCafe } from "../state/CafeContext";
import { artwork } from "../assets";
import { LoadState } from "./ui";
import { Modal } from "./Modal";
import { useApi } from "../hooks/useApi";
import { cafeApi } from "../services/cafeApi";
import { useStudyDraft } from "../state/StudyDraftContext";
import { clearPendingRequest } from "../utils/pendingRequests";
import { errorMessage } from "../api/http";
import { IconTooltips } from "./IconTooltips";
import { SessionNavigationProvider } from "../state/SessionNavigation";
import { sessionReturn } from "../utils/sessionReturn";

export function Layout() {
  const { user, notice, notify, exploreOpen, closeExplore } = useCafe();
  const { reset } = useStudyDraft();
  const navigate = useNavigate();
  const [restarting, setRestarting] = useState(false);
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
  async function startOver() {
    if (restarting) return;
    if (!user) {
      navigate("/");
      return;
    }
    setRestarting(true);
    try {
      const sessions = await cafeApi.sessions(user._id);
      for (const session of sessions.filter((item) =>
        ["planned", "active", "paused"].includes(item.status),
      )) {
        await cafeApi.sessionAction(session._id, "stop");
      }
      clearPendingRequest(user._id + "-prepare-task");
      clearPendingRequest(user._id + "-prepare-session");
      startTransition(() => {
        reset();
        navigate("/");
      });
    } catch (reason) {
      notify("Could not start over. " + errorMessage(reason));
    } finally {
      setRestarting(false);
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
      className={`app-shell ${landing ? "landing-shell" : session ? "session-shell" : paper ? "paper-shell" : "notebook-shell"}`}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {session && (
        <header className="site-header">
          <Link
            className="wordmark hanging-sign"
            aria-label="Cafe Tempo home"
            data-tooltip="start over?"
            to="/"
            aria-disabled={restarting}
            aria-busy={restarting}
            onClick={(event) => {
              event.preventDefault();
              void startOver();
            }}
          >
            <img src={artwork.homeSign} alt="" />
          </Link>
          {user && (
            <Link
              className="menu-toggle hanging-sign"
              aria-label="Sip Stats"
              data-tooltip="sip stats"
              to="/sip-stats"
            >
              <img src={artwork.sipStatsSign} alt="" />
            </Link>
          )}
        </header>
      )}
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
              onClick={(event) => void navigateFromExplore(event, "/tasks")}
              to="/tasks"
              aria-disabled={pausingForNavigation}
            >
              Task Board
            </NavLink>
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
        <Link
          className="text-link profile-link"
          onClick={closeMenu}
          to="/welcome"
        >
          Change Profile
        </Link>
      </Modal>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      <main id="main">
        <SessionNavigationProvider>
          <Outlet />
        </SessionNavigationProvider>
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
