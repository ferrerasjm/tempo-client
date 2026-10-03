import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCafe } from '../state/CafeContext';
import { artwork } from '../assets';
import { LoadState } from './ui';

export function Layout() {
  const { user, notice } = useCafe();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setMenuOpen(false); window.scrollTo({ top: 0 }); }, [location.pathname]);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header"><Link className="wordmark" to="/"><img src={artwork.cup} alt="" />cafe tempo<span className="draft-label">study cafe</span></Link>
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(value => !value)}>Menu {menuOpen ? '−' : '+'}</button>
      <nav id="main-nav" className={menuOpen ? 'open' : ''} aria-label="Main navigation">
        <NavLink to="/cafe">Cafe</NavLink><NavLink to="/tasks">Study board</NavLink><NavLink to="/focus">Focus</NavLink><NavLink to="/menu">Menu</NavLink><NavLink to="/reservations">Reservations</NavLink><NavLink to="/analytics">Progress</NavLink>
      </nav>
      <Link className="profile-link" to="/welcome">{user ? user.displayName : 'Enter the cafe'} <span aria-hidden="true">↗</span></Link>
    </header>
    {notice && <div className="toast" role="status">{notice}</div>}
    <main id="main"><Outlet /></main>
    <footer className="site-footer"><span>cafe tempo</span><p>Grab a drink. Pick a seat. Finish one thing at a time.</p><Link to="/history">Focus history</Link></footer>
  </>;
}

export function ProfileGate() {
  const { user, loading, error, retry } = useCafe();
  if (loading || error) return <section className="page"><LoadState loading={loading} error={error} retry={retry}>{null}</LoadState></section>;
  return user ? <Outlet /> : <Navigate to="/welcome" replace />;
}
