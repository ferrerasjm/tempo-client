import { Link } from "react-router-dom";
import { spaceArtwork } from "../assets";
export function CafeScene() {
  return (
    <div className="cafe-scene">
      <img
        src={spaceArtwork("Quiet Corner")}
        alt="The supplied cafe room illustration."
      />
      <nav className="scene-links" aria-label="Explore the cafe">
        <Link className="hotspot board" to="/tasks">
          Task Board <span aria-hidden="true">↗</span>
        </Link>
        <Link className="hotspot counter" to="/menu">
          The counter <span aria-hidden="true">↗</span>
        </Link>
      </nav>
      <div className="scene-invitation">
        <p>There’s a quiet corner waiting for you.</p>
        <Link className="button" to="/study/drink">
          Start Focusing →
        </Link>
      </div>
    </div>
  );
}
