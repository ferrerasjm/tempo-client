import { artwork } from '../assets';

export function SpaceIllustration({ name, className = '' }: { name: string; className?: string }) {
  return <img className={`space-illustration ${className}`} src={artwork.socialRoom}
    alt={`Cafe room illustration for ${name}`} width={1200} height={853} />;
}
