import { Link, useNavigate } from 'react-router-dom';
import { artwork } from '../assets';
import { useCafe } from '../state/CafeContext';
import { CafeScene } from '../components/CafeScene';
import { EmptyState, LoadState, PageHeading } from '../components/ui';

export function LandingPage() {
  return <>
    <section className="entrance"><p className="eyebrow">Your virtual study cafe</p><h1>A little room<br /><em>to focus.</em></h1><p>Slow down, settle in, and give one thing your attention.</p>
      <img className="storefront" src={artwork.entrance} alt="Cafe Tempo's welcoming storefront with a striped awning and an open door." />
      <Link className="button entrance-button" to="/welcome">Come on in <span aria-hidden="true">→</span></Link>
      <small className="entrance-note">A task. A quiet corner. A little progress.</small>
    </section>
  </>;
}

export function WelcomePage() {
  const cafe = useCafe();
  const navigate = useNavigate();
  return <section className="page narrow"><PageHeading eyebrow="Before you settle in" title="Welcome to the cafe." description="Choose a study profile to continue." />
    <LoadState loading={cafe.loading} error={cafe.error} retry={cafe.retry}>
      {cafe.users.length === 0 ? <EmptyState title="No profiles yet">Run the server seed command, then try again.</EmptyState> : <div className="profile-list">{cafe.users.map(user => <button className="profile-choice" key={user._id} onClick={() => { cafe.enter(user._id); navigate('/cafe'); }}><span className="avatar">{user.displayName.slice(0, 1)}</span><span><strong>{user.displayName}</strong><small>{user.email}</small></span><span aria-hidden="true">→</span></button>)}</div>}
    </LoadState>
    <p className="note">This draft uses existing demo profiles. Selecting a profile is not a password login.</p>
    {cafe.user && <button className="text-link" onClick={() => { cafe.leave(); cafe.notify('You left the study profile.'); }}>Leave current profile</button>}
  </section>;
}

export function LobbyPage() {
  const { user } = useCafe();
  return <section className="page lobby"><PageHeading eyebrow={`Welcome, ${user?.displayName.split(' ')[0]}`} title="Make yourself at home." description="Start a study session, or stop by the counter." /><CafeScene /></section>;
}
