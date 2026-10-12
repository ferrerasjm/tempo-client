import { useMemo } from "react";
import { artwork, displayAreaName, spaceArtwork } from "../assets";

const characterActions = [
  "working on a little idea",
  "taking notes",
  "working quietly",
  "reading a chapter",
  "sipping something warm",
  "enjoying a quiet moment",
  "making a little progress",
  "lost in thought",
  "sketching in the margins",
  "planning the next chapter",
  "organizing a few thoughts",
  "reviewing a small detail",
  "waiting for inspiration",
  "settling into a good rhythm",
  "highlighting an important line",
  "pausing to think things through",
  "checking off a tiny task",
  "drafting something new",
  "taking a well-earned break",
  "watching the rain outside",
  "keeping the evening company",
] as const;

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
  const activities = useMemo(() => {
    const shuffled = [...characterActions];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[index],
      ];
    }
    return shuffled.slice(0, 4);
  }, [areaName]);

  return (
    <div className={`room-scenery room-scenery-${displayAreaName(areaName).toLowerCase().replace(/\s+/g, "-")}`}>
      <img className="room-backdrop" src={spaceArtwork(areaName)} alt="" />
      {artwork.roomPets[areaName] && <span className="room-pet" aria-hidden="true">
        <img src={artwork.roomPets[areaName]} alt="" />
      </span>}
      <div className="room-characters" aria-label="Decorative cafe characters">
        <CafeVisitor
          key={`${areaName}-yellow`}
          activity={activities[0]}
          drink={artwork.drinks.americano}
          character={artwork.characters.yellow}
        />
        <CafeVisitor
          key={`${areaName}-green`}
          activity={activities[1]}
          drink={artwork.drinks.matcha}
          character={artwork.characters.green}
        />
        <CafeVisitor
          key={`${areaName}-blue`}
          activity={activities[2]}
          drink={artwork.drinks.cappuccino}
          character={artwork.characters.blue}
        />
        <CafeVisitor
          key={`${areaName}-red`}
          activity={activities[3]}
          drink={artwork.drinks.latte}
          character={artwork.characters.red}
        />
      </div>
    </div>
  );
}
