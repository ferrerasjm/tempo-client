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
  const immersive = /^\/focus\/[^/]+$/.test(location.pathname);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><Link className="wordmark" to={user ? '/cafe' : '/'}><img src={artwork.cup} alt="" />cafe tempo</Link>
      {user && <button className="menu-toggle" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>Explore <span aria-hidden="true">☰</span></button>}
    </header>
    <Modal open={menuOpen} title="Around the cafe" onClose={() => setMenuOpen(false)}>
      <nav className="explore-nav" aria-label="Main navigation">
        <div><p className="eyebrow">Settle in</p><NavLink to="/cafe">Cafe home</NavLink><NavLink to="/focus">Start a session</NavLink><NavLink to="/tasks">Study board</NavLink><NavLink to="/spaces">Find a space</NavLink></div>
        <div><p className="eyebrow">Take a little break</p><NavLink to="/menu">Drink & snack menu</NavLink><NavLink to="/reservations">Your reservations</NavLink><NavLink to="/orders">Your orders</NavLink></div>
        <div><p className="eyebrow">Your notebook</p><NavLink to="/analytics">Progress</NavLink><NavLink to="/history">Focus history</NavLink></div>
      </nav>
      <Link className="text-link profile-link" to="/welcome">{user?.displayName} · Change profile</Link>
    </Modal>
    {notice && <div className="toast" role="status">{notice}</div>}
    <main id="main"><Outlet /></main>
    {!immersive && <footer className="site-footer"><span>cafe tempo</span><p>A little space to finish one thing.</p></footer>}
  </>;
}
export function ProfileGate() {
  const { user, loading, error, retry } = useCafe();
  if (loading || error) return <section className="page"><LoadState loading={loading} error={error} retry={retry}>{null}</LoadState></section>;
  return user ? <Outlet /> : <Navigate to="/welcome" replace />;
}
