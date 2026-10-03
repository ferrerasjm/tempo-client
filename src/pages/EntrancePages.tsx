import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artwork } from '../assets';
import { useCafe } from '../state/CafeContext';
import { CafeScene } from '../components/CafeScene';
import { EmptyState, LoadState, PageHeading } from '../components/ui';

export function LandingPage() {
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  return <section className="entrance gif-entrance">
    <Link className="entrance-art" to="/welcome" aria-label="Enter Cafe Tempo" aria-describedby="entrance-tooltip"
      onPointerEnter={() => setTooltipDismissed(false)} onPointerLeave={() => setTooltipDismissed(false)}
      onFocus={() => setTooltipDismissed(false)} onBlur={() => setTooltipDismissed(false)}
      onKeyDown={event => { if (event.key === 'Escape') setTooltipDismissed(true); }}>
      <img src={artwork.entrance} width={1440} height={800} alt="An animated pixel-art cafe surrounded by greenery, with cats sitting by the entrance." />
      <span id="entrance-tooltip" role="tooltip" className={tooltipDismissed ? 'entrance-tooltip dismissed' : 'entrance-tooltip'}>ready to lock in?</span>
    </Link>
    <h1 className="entrance-caption">cafe tempo</h1>
  </section>;
}

export function WelcomePage() {
  const cafe = useCafe();
  const navigate = useNavigate();
  return <section className="page narrow"><PageHeading eyebrow="Before you settle in" title="Welcome to the cafe." description="Choose a study profile to continue." />
    <LoadState loading={cafe.loading} error={cafe.error} retry={cafe.retry}>
      {cafe.users.length === 0 ? <EmptyState title="No profiles yet">Run the server seed command, then try again.</EmptyState> : <div className="profile-list">{cafe.users.map(user => <button className="profile-choice" key={user._id} onClick={() => { cafe.enter(user._id); navigate('/study/drink'); }}><span className="avatar">{user.displayName.slice(0, 1)}</span><span><strong>{user.displayName}</strong><small>{user.email}</small></span><span aria-hidden="true">→</span></button>)}</div>}
    </LoadState>
    <p className="note">This draft uses existing demo profiles. Selecting a profile is not a password login.</p>
    {cafe.user && <button className="text-link" onClick={() => { cafe.leave(); cafe.notify('You left the study profile.'); }}>Leave current profile</button>}
  </section>;
}

export function LobbyPage() {
  const { user } = useCafe();
  return <section className="page lobby"><PageHeading eyebrow={`Welcome, ${user?.displayName.split(' ')[0]}`} title="Make yourself at home." description="Start a study session, or stop by the counter." /><CafeScene /></section>;
}
