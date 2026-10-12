import type { Area } from "../types";
import { displayAreaName } from "../assets";
import { SpaceIllustration } from "./SpaceIllustration";

export function SpaceBrowser({
  areas,
  value,
  onChange,
}: {
  areas: Area[];
  value: string;
  onChange: (id: string) => void;
}) {
  const index = Math.max(
    0,
    areas.findIndex((area) => area._id === value),
  );
  const area = areas[index];
  if (!area) return null;
  return (
    <div className="space-browser">
      <div className="space-stage" key={area._id}>
        <SpaceIllustration name={area.name} />
        <h2>{displayAreaName(area.name)}</h2>
        <p>{area.theme}</p>
      </div>
      <div className="space-switcher">
        <button
          className="icon-button"
          aria-label="Previous space"
          disabled={index === 0}
          onClick={() => onChange(areas[index - 1]._id)}
        >
          ←
        </button>
        <small>
          {index + 1} / {areas.length} spaces
        </small>
        <button
          className="icon-button"
          aria-label="Next space"
          disabled={index === areas.length - 1}
          onClick={() => onChange(areas[index + 1]._id)}
        >
          →
        </button>
      </div>
    </div>
  );
}
