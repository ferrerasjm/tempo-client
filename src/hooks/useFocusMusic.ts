import { useEffect, useRef, useState } from "react";
import { spaceMusic } from "../assets";

const FADE_MILLISECONDS = 900;

type PlayingTrack = { audio: HTMLAudioElement; source: string };

export function useFocusMusic(running: boolean, areaName = "") {
  const active = useRef<PlayingTrack | null>(null);
  const pending = useRef<PlayingTrack | null>(null);
  const tracks = useRef(new Set<PlayingTrack>());
  const animation = useRef<number | null>(null);
  const transition = useRef(0);
  const volumeRef = useRef(0.4);
  const [volume, setVolumeState] = useState(0.4);
  const [error, setError] = useState("");
  const source = spaceMusic(areaName);
  const available = Boolean(source);

  function dispose(item: PlayingTrack | null) {
    if (!item) return;
    item.audio.pause();
    item.audio.removeAttribute("src");
    tracks.current.delete(item);
  }

  function cancelFade() {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
  }

  function fade(from: PlayingTrack[], to: PlayingTrack | null) {
    cancelFade();
    const startedAt = performance.now();
    const fromVolumes = from.map((item) => [item, item.audio.volume] as const);
    const frame = (now: number) => {
      const progress = Math.max(
        0,
        Math.min(1, (now - startedAt) / FADE_MILLISECONDS),
      );
      for (const [item, initialVolume] of fromVolumes)
        item.audio.volume = Math.max(0, initialVolume * (1 - progress));
      if (to) to.audio.volume = Math.min(1, volumeRef.current * progress);
      if (progress < 1) animation.current = requestAnimationFrame(frame);
      else {
        animation.current = null;
        for (const item of from) if (item !== to) dispose(item);
      }
    };
    animation.current = requestAnimationFrame(frame);
  }

  useEffect(() => {
    const id = ++transition.current;
    dispose(pending.current);
    pending.current = null;
    setError("");
    const current = active.current;

    if (!running || !source) {
      active.current = null;
      // A paused room change must not leave the previous room audible while
      // its fade is restarted. Loading/play promises can also arrive late.
      cancelFade();
      for (const item of [...tracks.current]) {
        if (item.source !== source) dispose(item);
      }
      fade([...tracks.current], null);
      return;
    }
    if (current?.source === source) {
      if (current.audio.paused) {
        current.audio.volume = 0;
        current.audio
          .play()
          .then(() => fade([], current))
          .catch(() =>
            setError(
              "Music could not start. Pause and resume the timer to try again.",
            ),
          );
      }
      return;
    }

    const audio = new Audio(source);
    const incoming = { audio, source };
    pending.current = incoming;
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audio.addEventListener("playing", () => {
      if (transition.current === id) setError("");
    });
    audio.addEventListener("error", () => {
      if (transition.current === id)
        setError(`The music for ${areaName} could not be loaded.`);
    });
    audio
      .play()
      .then(() => {
        if (transition.current !== id) return dispose(incoming);
        pending.current = null;
        tracks.current.add(incoming);
        active.current = incoming;
        fade(
          [...tracks.current].filter((item) => item !== incoming),
          incoming,
        );
      })
      .catch(() => {
        dispose(incoming);
        if (transition.current === id) {
          pending.current = null;
          active.current = null;
          fade([...tracks.current], null);
          setError(
            "Music could not start. Pause and resume the timer to try again.",
          );
        }
      });
  }, [running, source, areaName]);

  useEffect(
    () => () => {
      transition.current += 1;
      cancelFade();
      dispose(pending.current);
      pending.current = null;
      for (const item of [...tracks.current]) dispose(item);
      active.current = null;
    },
    [],
  );

  function setVolume(next: number) {
    const safeVolume = Math.max(0, Math.min(1, next));
    volumeRef.current = safeVolume;
    setVolumeState(safeVolume);
    if (active.current && animation.current === null)
      active.current.audio.volume = safeVolume;
  }

  return { available, error, volume, setVolume };
}
