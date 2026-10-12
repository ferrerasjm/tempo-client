import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useFocusMusic } from "../hooks/useFocusMusic";
import { useCafe } from "./CafeContext";
import type { FocusSession } from "../types";

type Playback = { session: FocusSession | null; areaName: string };
type MusicState = ReturnType<typeof useFocusMusic> & {
  updatePlayback: (session: FocusSession, areaName: string) => void;
};
const Context = createContext<MusicState | null>(null);

export function FocusMusicProvider({ children }: { children: ReactNode }) {
  const { user } = useCafe();
  const { pathname } = useLocation();
  const [playback, setPlayback] = useState<Playback>({
    session: null,
    areaName: "",
  });
  const sameUser = Boolean(user && playback.session?.user === user._id);
  const inSession = pathname === `/focus/${playback.session?._id}`;
  const music = useFocusMusic(
    sameUser && (inSession || pathname === "/sip-stats"),
    sameUser ? playback.areaName : "",
  );
  const updatePlayback = useCallback(
    (session: FocusSession, areaName: string) => {
      setPlayback((current) =>
        current.session === session && current.areaName === areaName
          ? current
          : { session, areaName },
      );
    },
    [],
  );

  return (
    <Context.Provider value={{ ...music, updatePlayback }}>
      {children}
    </Context.Provider>
  );
}

export function useSessionMusic() {
  const context = useContext(Context);
  if (!context) throw new Error("Session music requires FocusMusicProvider");
  return context;
}
