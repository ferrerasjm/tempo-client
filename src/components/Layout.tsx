import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCafe } from '../state/CafeContext';
import { artwork } from '../assets';
import { LoadState } from './ui';
import { Modal } from './Modal';
import { useApi } from '../hooks/useApi';
import { cafeApi } from '../services/cafeApi';

export function Layout() {
  const { user, notice, exploreOpen, closeExplore } = useCafe();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hiddenTooltip, setHiddenTooltip] = useState<string | null>(null);
  const [signTooltipPosition, setSignTooltipPosition] = useState({ home: { x: 56, y: 96 }, explore: { x: 1490, y: 96 } });
  const location = useLocation();
  const focus = useApi(() => (menuOpen || exploreOpen) && user ? cafeApi.sessions(user._id) : Promise.resolve([]), [menuOpen, exploreOpen, user?._id, location.pathname]);
  const unfinished = focus.data?.find(item => ['planned', 'active', 'paused'].includes(item.status));
  useEffect(() => { setMenuOpen(false); closeExplore(); window.scrollTo({ top: 0 }); }, [location.pathname, location.search]);
  const session = /^\/focus\/[^/]+$/.test(location.pathname);
  const paper = ['/welcome', '/focus', '/menu', '/order-summary'].includes(location.pathname) || location.pathname.startsWith('/orders/') || location.pathname.startsWith('/study/');
  const room = location.pathname === '/cafe';
  const landing = location.pathname === '/';
  return <div className={`app-shell ${landing ? 'landing-shell' : session ? 'session-shell' : room ? 'room-shell' : paper ? 'paper-shell' : 'notebook-shell'}`}>
    <a className="skip-link" href="#main">Skip to content</a>
    {!landing && location.pathname !== '/sip-stats' && <header className="site-header"><Link className="wordmark hanging-sign" aria-label="Cafe Tempo home" to="/" onMouseEnter={() => setHiddenTooltip(null)} onFocus={() => setHiddenTooltip(null)} onPointerMove={event => {
      if (event.pointerType !== 'mouse') return;
      setSignTooltipPosition(current => ({ ...current, home: { x: Math.max(8, Math.min(window.innerWidth - 8, event.clientX)), y: event.clientY } }));
    }} onKeyDown={event => { if (event.key === 'Escape') setHiddenTooltip('home'); }}>
      <img src={artwork.coffeeSign} alt="" />
      <span className="sign-tooltip" hidden={hiddenTooltip === 'home'} aria-hidden="true" style={{ left: `clamp(80px, ${signTooltipPosition.home.x}px, calc(100vw - 80px))`, top: `${signTooltipPosition.home.y}px` }}>start over?</span>
    </Link>
      {user && <Link className="menu-toggle hanging-sign" aria-label="Sip Stats" to="/sip-stats" onMouseEnter={() => setHiddenTooltip(null)} onFocus={() => setHiddenTooltip(null)} onPointerMove={event => {
        if (event.pointerType !== 'mouse') return;
        setSignTooltipPosition(current => ({ ...current, explore: { x: Math.max(8, Math.min(window.innerWidth - 8, event.clientX)), y: event.clientY } }));
      }} onKeyDown={event => { if (event.key === 'Escape') setHiddenTooltip('explore'); }}>
        <img src={artwork.bathroomSign} alt="" />
        <span className="sign-tooltip" hidden={hiddenTooltip === 'explore'} aria-hidden="true" style={{ left: `clamp(80px, ${signTooltipPosition.explore.x}px, calc(100vw - 80px))`, top: `${signTooltipPosition.explore.y}px` }}>sip stats</span>
      </Link>}
    </header>}
    <Modal open={menuOpen || exploreOpen} title="Explore the Cafe" onClose={() => { setMenuOpen(false); closeExplore(); }}>
      <nav className="explore-nav" aria-label="Main navigation">
        <div><p className="eyebrow">In the Cafe</p>
          {focus.loading ? <p className="note" role="status">Checking Your Timer…</p> : focus.error ? <p className="note" role="alert">Your Timer Could Not Be Checked. <button className="text-link" onClick={focus.reload}>Retry</button></p> : <NavLink onClick={() => setMenuOpen(false)} to={unfinished ? `/focus/${unfinished._id}` : '/study/drink'}>{unfinished ? 'Return To Focus' : 'Choose A Drink'}</NavLink>}
          <NavLink onClick={() => setMenuOpen(false)} to="/tasks">Task Board</NavLink><NavLink onClick={() => setMenuOpen(false)} to="/menu">Reward Shop</NavLink>
        </div>
        <div><p className="eyebrow">Your Notebook</p><NavLink onClick={() => setMenuOpen(false)} to="/orders">Your Orders</NavLink><NavLink onClick={() => setMenuOpen(false)} to="/history">Focus History</NavLink><NavLink onClick={() => setMenuOpen(false)} to="/analytics">Productivity Analytics</NavLink></div>
      </nav>
      <Link className="text-link profile-link" onClick={() => setMenuOpen(false)} to="/welcome">Change Profile</Link>
    </Modal>
    {notice && <div className="toast" role="status">{notice}</div>}
    <main id="main"><Outlet /></main>
  </div>;
}
export function ProfileGate() {
  const { user, loading, error, retry } = useCafe();
  if (loading || error) return <section className="page"><LoadState loading={loading} error={error} retry={retry}>{null}</LoadState></section>;
  return user ? <Outlet /> : <Navigate to="/welcome" replace />;
}
