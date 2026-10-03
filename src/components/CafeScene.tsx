import { Link } from 'react-router-dom';
import { artwork } from '../assets';

export function CafeScene() {
  return <div className="cafe-scene"><img src={artwork.room} alt="An illustrated study cafe with a window, study board, wall clock, drink counter, and reservation sign." />
    <nav className="scene-links" aria-label="Explore the cafe">
      <Link className="hotspot board" to="/tasks"><span>Study board</span><small>Plan your tasks ↗</small></Link>
      <Link className="hotspot clock" to="/focus"><span>Wall clock</span><small>Start focusing ↗</small></Link>
      <Link className="hotspot counter" to="/menu"><span>The counter</span><small>Pick a drink ↗</small></Link>
      <Link className="hotspot window" to="/spaces"><span>A seat for you</span><small>Explore spaces ↗</small></Link>
      <Link className="hotspot journal" to="/analytics"><span>Your notebook</span><small>See your progress ↗</small></Link>
    </nav>
  </div>;
}
