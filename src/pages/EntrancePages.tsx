import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artwork } from '../assets';
import { useCafe } from '../state/CafeContext';
import { CafeScene } from '../components/CafeScene';
import { EmptyState, LoadState, PageHeading } from '../components/ui';

export function LandingPage() {
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 50, y: 25 });
  return <section className="entrance gif-entrance">
    <Link className="entrance-art" to="/welcome" aria-label="Enter Cafe Tempo" aria-describedby="entrance-tooltip"
      onPointerEnter={() => setTooltipDismissed(false)} onPointerLeave={() => setTooltipDismissed(true)}
      onPointerMove={event => {
        if (event.pointerType !== 'mouse') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        setTooltipPosition({ x, y });
      }}
      onFocus={() => setTooltipDismissed(false)} onBlur={() => setTooltipDismissed(false)}
      onKeyDown={event => { if (event.key === 'Escape') setTooltipDismissed(true); }}>
      <img src={artwork.entrance} width={1440} height={800} alt="An animated pixel-art cafe surrounded by greenery, with cats sitting by the entrance." />
      <span id="entrance-tooltip" role="tooltip" className={tooltipDismissed ? 'entrance-tooltip dismissed' : 'entrance-tooltip'} style={{ left: `${tooltipPosition.x}%`, top: `${tooltipPosition.y}%` }}>ready to lock in?</span>
    </Link>
    <h1 className="entrance-caption">cafe tempo</h1>
  </section>;
}

export function WelcomePage() {
  const cafe = useCafe();
  const navigate = useNavigate();
  return <section className="page narrow welcome-page"><PageHeading eyebrow="Before you settle in" title="Welcome to Cafe Tempo" description="Slow down, settle in, and give one thing your attention." />
    <LoadState loading={cafe.loading} error={cafe.error} retry={cafe.retry}>
      {cafe.users.length === 0 ? <EmptyState title="No profiles yet">Run the server seed command, then try again.</EmptyState> : <div className="profile-list">{cafe.users.map(user => <button className="profile-choice" key={user._id} onClick={() => { cafe.enter(user._id); navigate('/study/drink'); }}><span className="avatar">{user.displayName.slice(0, 1)}</span><span><strong>{user.displayName}</strong><small>{user.email}</small></span><span className="profile-choice-action"><span>Continue</span><span aria-hidden="true">→</span></span></button>)}</div>}
    </LoadState>
    {cafe.user && <button className="text-link" onClick={() => { cafe.leave(); cafe.notify('You left the profile.'); }}>Leave Current Profile</button>}
  </section>;
}

export function LobbyPage() {
  const { user } = useCafe();
  return <section className="page lobby"><PageHeading eyebrow={`Welcome, ${user?.displayName.split(' ')[0]}`} title="Make yourself at home." description="Start Focusing, or stop by the counter." /><CafeScene /></section>;
}
