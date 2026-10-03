import { useEffect, useRef, useState } from 'react';
import { artwork } from '../assets';

export function useFocusMusic(running: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(.35);
  const [error, setError] = useState('');
  const available = Boolean(artwork.music);
  useEffect(() => {
    if (!available) return;
    const track = new Audio(artwork.music);
    track.loop = true; track.preload = 'none'; track.volume = volume;
    track.addEventListener('playing', () => setError(''));
    track.addEventListener('error', () => setError('The music file could not be loaded.'));
    audio.current = track;
    return () => { track.pause(); track.removeAttribute('src'); audio.current = null; };
  }, [available]);
  useEffect(() => {
    if (running) audio.current?.play().catch(() => setError('Music could not start. Pause and resume the timer to try again.'));
    else audio.current?.pause();
  }, [running]);
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);
  return { available, error, volume, setVolume };
}
