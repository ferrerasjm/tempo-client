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
      <a className="scroll-note" href="#ritual">A small ritual, a fresh start ↓</a>
    </section>
    <section className="ritual" id="ritual"><p className="eyebrow">Make yourself at home</p><h2>One thing at a time.</h2><div className="ritual-steps">
      <div><span>01</span><h3>Find your corner.</h3><p>A sunny window, a quiet nook, or a table for your notes.</p></div>
      <div><span>02</span><h3>Choose your task.</h3><p>Bring your to-do list. We’ll help you decide where to begin.</p></div>
      <div><span>03</span><h3>Stay for a session.</h3><p>Focus, take a break, and see the work you’ve put in.</p></div>
    </div><Link className="text-link" to="/welcome">Find your seat →</Link></section>
  </>;
}

export function WelcomePage() {
  const cafe = useCafe();
  const navigate = useNavigate();
  return <section className="page narrow"><PageHeading eyebrow="Before you settle in" title="Welcome to the cafe." description="Choose a study profile to continue." />
    <p className="note">This draft uses existing demo profiles. Selecting a profile is not a password login.</p>
    <LoadState loading={cafe.loading} error={cafe.error} retry={cafe.retry}>
      {cafe.users.length === 0 ? <EmptyState title="No profiles yet">Run the server seed command, then try again.</EmptyState> : <div className="profile-list">{cafe.users.map(user => <button className="profile-choice" key={user._id} onClick={() => { cafe.enter(user._id); navigate('/cafe'); }}><span className="avatar">{user.displayName.slice(0, 1)}</span><span><strong>{user.displayName}</strong><small>{user.email}</small></span><span aria-hidden="true">→</span></button>)}</div>}
    </LoadState>
    {cafe.user && <button className="text-link" onClick={() => { cafe.leave(); cafe.notify('You left the study profile.'); }}>Leave current profile</button>}
  </section>;
}

export function LobbyPage() {
  const { user } = useCafe();
  return <section className="page lobby"><PageHeading eyebrow="The cafe is open" title={`Settle in, ${user?.displayName.split(' ')[0]}.`} description="Choose an object in the room to get started." action={<Link className="text-link" to="/spaces">See all five spaces →</Link>} /><CafeScene /><p className="scene-caption">Your tasks on the board. Your drink at the counter. A quiet moment just for you.</p></section>;
}
