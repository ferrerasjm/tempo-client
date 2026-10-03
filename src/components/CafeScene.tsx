import { Link } from 'react-router-dom';
import { artwork } from '../assets';
export function CafeScene() {
  return <div className="cafe-scene">
    <img src={artwork.room} alt="An original illustrated cafe with a window, study board and drink counter." />
    <nav className="scene-links" aria-label="Explore the cafe">
      <Link className="hotspot board" to="/tasks">Study board <span aria-hidden="true">↗</span></Link>
      <Link className="hotspot counter" to="/menu">The counter <span aria-hidden="true">↗</span></Link>
    </nav>
    <div className="scene-invitation"><p>There’s a quiet corner waiting for you.</p><Link className="button" to="/focus">Start a study session →</Link></div>
  </div>;
}
