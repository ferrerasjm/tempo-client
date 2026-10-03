import { useState } from 'react';
import { artwork } from '../assets';

// These supplied characters are decorative; they do not represent accounts.
function CafeVisitor({ activity, drink, character }: { activity: string; drink: string; character: string }) {
  const [dismissed, setDismissed] = useState(false);
  return <figure className={`cafe-visitor ${dismissed ? 'tooltip-dismissed' : ''}`} tabIndex={0}
    aria-label={`Decorative cafe character: ${activity.toLowerCase()}`}
    onMouseEnter={() => setDismissed(false)} onFocus={() => setDismissed(false)}
    onKeyDown={event => { if (event.key === 'Escape') setDismissed(true); }}>
    <img className="visitor-furniture" src={artwork.furniture} alt="" width={339} height={350} />
    <div className="visitor-character-position"><img className="visitor-character" src={character} alt="" width={218} height={192} /></div>
    <img className="visitor-drink" src={drink} alt="" width={128} height={128} />
    <figcaption className="character-tooltip">{activity}</figcaption>
  </figure>;
}

export function CafeRoomScene() {
  return <div className="room-scenery">
    <img className="room-backdrop" src={artwork.socialRoom} alt="" width={1200} height={853} />
    <div className="room-characters" aria-label="Decorative cafe characters">
      <CafeVisitor activity="working on a little idea" drink={artwork.drinks.americano} character={artwork.characters.yellow} />
      <CafeVisitor activity="taking notes" drink={artwork.drinks.matcha} character={artwork.characters.green} />
      <CafeVisitor activity="working quietly" drink={artwork.drinks.cappuccino} character={artwork.characters.blue} />
      <CafeVisitor activity="reading a chapter" drink={artwork.drinks.latte} character={artwork.characters.red} />
    </div>
  </div>;
}
