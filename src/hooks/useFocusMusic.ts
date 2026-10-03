import { useEffect, useRef, useState } from 'react';
import { artwork } from '../assets';

export function useFocusMusic(running: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(.35);
  const [wanted, setWanted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const available = Boolean(artwork.music);
  useEffect(() => {
    if (!available) return;
    const track = new Audio(artwork.music);
    track.loop = true; track.preload = 'none'; track.volume = volume;
    track.addEventListener('playing', () => { setPlaying(true); setError(''); });
    track.addEventListener('pause', () => setPlaying(false));
    track.addEventListener('error', () => setError('The music file could not be loaded.'));
    audio.current = track;
    return () => { track.pause(); track.removeAttribute('src'); audio.current = null; };
  }, [available]);
  function play() {
    audio.current?.play().catch(() => setError('Press Play music to allow audio in your browser.'));
  }
  useEffect(() => { if (running && wanted) play(); else audio.current?.pause(); }, [running, wanted]);
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);
  function toggle() {
    if (playing || (wanted && !error)) { setWanted(false); audio.current?.pause(); }
    else { setWanted(true); play(); }
  }
  return { available, playing, error, volume, setVolume, toggle };
}
