import { useEffect, useRef, useState } from "react";
import { spaceMusic } from "../assets";

const FADE_MILLISECONDS = 900;

type PlayingTrack = { audio: HTMLAudioElement; source: string };

export function useFocusMusic(enabled: boolean, areaName = "") {
  const active = useRef<PlayingTrack | null>(null);
  const pending = useRef<PlayingTrack | null>(null);
  const tracks = useRef(new Set<PlayingTrack>());
  const animation = useRef<number | null>(null);
  const transition = useRef(0);
  const [volume, setVolumeState] = useState(() => {
    const saved = Number(localStorage.getItem("tempo-room-music-volume"));
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 0.4;
  });
  const volumeRef = useRef(volume);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [pausedSource, setPausedSource] = useState("");
  const [attempt, setAttempt] = useState(0);
  const source = spaceMusic(areaName);
  const available = Boolean(source);
  const running = enabled && source !== pausedSource;
  useEffect(() => {
    setPausedSource("");
  }, [source]);

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
    let retryGesture: (() => void) | null = null;
    function clearGestureRetry() {
      if (!retryGesture) return;
      window.removeEventListener("pointerdown", retryGesture, true);
      window.removeEventListener("keydown", retryGesture, true);
      retryGesture = null;
    }
    function playTrack(
      item: PlayingTrack,
      onStarted: () => void,
      onFailed: () => void,
    ) {
      const tryPlay = () => {
        item.audio
          .play()
          .then(() => {
            clearGestureRetry();
            if (transition.current === id) onStarted();
          })
          .catch((reason) => {
            if (transition.current !== id) return;
            if (reason?.name === "NotAllowedError") {
              setError("");
              retryGesture = () => {
                clearGestureRetry();
                tryPlay();
              };
              window.addEventListener("pointerdown", retryGesture, true);
              window.addEventListener("keydown", retryGesture, true);
            } else onFailed();
          });
      };
      tryPlay();
    }
    dispose(pending.current);
    pending.current = null;
    setError("");
    const current = active.current;

    if (!running || !source) {
      setPlaying(false);
      active.current = null;
      cancelFade();
      for (const item of [...tracks.current]) {
        if (item.source !== source) dispose(item);
      }
      fade([...tracks.current], null);
      return clearGestureRetry;
    }
    if (current?.source === source) {
      setPlaying(!current.audio.paused);
      if (current.audio.paused) {
        current.audio.volume = 0;
        playTrack(
          current,
          () => {
            setError("");
            setPlaying(true);
            fade([], current);
          },
          () => {
            setPlaying(false);
            setError("Room music is unavailable.");
          },
        );
      }
      return clearGestureRetry;
    }

    const audio = new Audio(source);
    setPlaying(false);
    const incoming = { audio, source };
    pending.current = incoming;
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audio.addEventListener("playing", () => {
      if (transition.current === id) setError("");
    });
    audio.addEventListener("error", () => {
      if (transition.current === id) {
        setPlaying(false);
        setError(`The music for ${areaName} could not be loaded.`);
      }
    });
    playTrack(
      incoming,
      () => {
        pending.current = null;
        tracks.current.add(incoming);
        active.current = incoming;
        setPlaying(true);
        fade(
          [...tracks.current].filter((item) => item !== incoming),
          incoming,
        );
      },
      () => {
        dispose(incoming);
        pending.current = null;
        active.current = null;
        setPlaying(false);
        fade([...tracks.current], null);
        setError("Room music is unavailable.");
      },
    );
    return clearGestureRetry;
  }, [running, source, areaName, attempt]);

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
    localStorage.setItem("tempo-room-music-volume", String(safeVolume));
    if (active.current && animation.current === null)
      active.current.audio.volume = safeVolume;
  }

  function togglePlayback() {
    if (!enabled || !source) return;
    if (playing) setPausedSource(source);
    else {
      setPausedSource("");
      setAttempt((value) => value + 1);
    }
  }

  return { available, error, volume, setVolume, playing, togglePlayback };
}
