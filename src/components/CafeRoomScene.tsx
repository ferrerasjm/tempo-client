import { artwork, spaceArtwork } from "../assets";

function CafeVisitor({
  activity,
  drink,
  character,
}: {
  activity: string;
  drink: string;
  character: string;
}) {
  return (
    <figure
      className="cafe-visitor"
      tabIndex={0}
      data-tooltip={activity}
      aria-label={`Decorative cafe character: ${activity.toLowerCase()}`}
    >
      <img
        className="visitor-furniture"
        src={artwork.furniture}
        alt=""
        width={768}
        height={768}
      />
      <div className="visitor-character-position">
        <img className="visitor-character" src={character} alt="" />
      </div>
      <img
        className="visitor-drink"
        src={drink}
        alt=""
        width={128}
        height={128}
      />
    </figure>
  );
}

export function CafeRoomScene({ areaName }: { areaName: string }) {
  return (
    <div className="room-scenery">
      <img className="room-backdrop" src={spaceArtwork(areaName)} alt="" />
      <div className="room-characters" aria-label="Decorative cafe characters">
        <CafeVisitor
          activity="working on a little idea"
          drink={artwork.drinks.americano}
          character={artwork.characters.yellow}
        />
        <CafeVisitor
          activity="taking notes"
          drink={artwork.drinks.matcha}
          character={artwork.characters.green}
        />
        <CafeVisitor
          activity="working quietly"
          drink={artwork.drinks.cappuccino}
          character={artwork.characters.blue}
        />
        <CafeVisitor
          activity="reading a chapter"
          drink={artwork.drinks.latte}
          character={artwork.characters.red}
        />
      </div>
    </div>
  );
}
