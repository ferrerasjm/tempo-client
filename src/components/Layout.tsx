import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCafe } from '../state/CafeContext';
import { artwork } from '../assets';
import { LoadState } from './ui';
import { Modal } from './Modal';

export function Layout() {
  const { user, notice } = useCafe();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setMenuOpen(false); window.scrollTo({ top: 0 }); }, [location.pathname, location.search]);
  const session = /^\/focus\/[^/]+$/.test(location.pathname);
  const paper = ['/welcome', '/focus', '/menu', '/order-summary'].includes(location.pathname) || location.pathname.startsWith('/orders/') || location.pathname.startsWith('/study/');
  const room = location.pathname === '/cafe';
  const landing = location.pathname === '/';
  return <div className={`app-shell ${landing ? 'landing-shell' : session ? 'session-shell' : room ? 'room-shell' : paper ? 'paper-shell' : 'notebook-shell'}`}>
    <a className="skip-link" href="#main">Skip to content</a>
    {!landing && <header className="site-header"><Link className="wordmark hanging-sign" aria-label="Cafe Tempo home" to="/"><img src={artwork.cup} alt="" /><span>cafe tempo</span></Link>
      {user && <button className="menu-toggle hanging-sign" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><svg viewBox="0 0 48 40" aria-hidden="true"><path d="M7 8q9-3 17 2 8-5 17-2v26q-9-3-17 2-8-5-17-2zM24 10v26M11 14l8 1m-8 6 8 1m10-7 8-1m-8 7 8-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg><span>Explore</span></button>}
    </header>}
    <Modal open={menuOpen} title="Around the cafe" onClose={() => setMenuOpen(false)}>
      <nav className="explore-nav" aria-label="Main navigation">
        <div><p className="eyebrow">Settle in</p><NavLink to="/study/drink">Prepare a session</NavLink><NavLink to="/cafe">Cafe lobby</NavLink><NavLink to="/focus">Smart focus recommendation</NavLink><NavLink to="/tasks">Study board</NavLink><NavLink to="/spaces">Find a space</NavLink></div>
        <div><p className="eyebrow">Take a little break</p><NavLink to="/menu">Reward shop</NavLink><NavLink to="/reservations">Your reservations</NavLink><NavLink to="/orders">Your orders</NavLink></div>
        <div><p className="eyebrow">Your notebook</p><NavLink to="/analytics">Productivity Analytics</NavLink><NavLink to="/history">Focus history</NavLink></div>
      </nav>
      <Link className="text-link profile-link" to="/welcome">{user?.displayName} · Change profile</Link>
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
