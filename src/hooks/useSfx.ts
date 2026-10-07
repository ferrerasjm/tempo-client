import { useCallback, useEffect, useRef } from "react";

const successSource = "/assets/audio/success-cut.m4a";
const clickSource = "/assets/audio/click-cut.m4a";

export function useSfx() {
  const sounds = useRef<{
    success: HTMLAudioElement;
    click: HTMLAudioElement;
  } | null>(null);

  useEffect(() => {
    const success = new Audio(successSource);
    const click = new Audio(clickSource);
    success.preload = "auto";
    click.preload = "auto";
    sounds.current = { success, click };
    let unlocked = false;
    function unlock() {
      if (unlocked || !sounds.current) return;
      unlocked = true;
      for (const audio of [success, click]) {
        audio.muted = true;
        const promise = audio.play();
        promise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          })
          .catch((reason) => {
            audio.muted = false;
            unlocked = false;
            console.warn("Sound effects could not be unlocked.", reason);
          });
      }
    }
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      success.pause();
      click.pause();
      sounds.current = null;
    };
  }, []);

  const play = useCallback((name: "success" | "click") => {
    const audio = sounds.current?.[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.muted = false;
    void audio.play().catch((reason) => {
      console.warn(`The ${name} sound effect could not play.`, reason);
    });
  }, []);

  return { play };
}
