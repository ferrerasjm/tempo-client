import { spaceArtwork } from "../assets";

export function SpaceIllustration({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <img
      className={`space-illustration ${className}`}
      src={spaceArtwork(name)}
      alt={`Cafe room illustration for ${name}`}
    />
  );
}
