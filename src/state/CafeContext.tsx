import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cafeApi } from "../services/cafeApi";
import { errorMessage } from "../api/http";
import type { Selection, User } from "../types";

interface CafeState {
  user: User | null;
  loading: boolean;
  error: string;
  retry: () => void;
  login: (email: string, password: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  leave: (beforeClear?: () => void) => Promise<void>;
  basket: Selection[];
  setQuantity: (id: string, quantity: number) => void;
  selectOnly: (id: string) => void;
  clearBasket: () => void;
  notice: string;
  notify: (message: string) => void;
  exploreOpen: boolean;
  openExplore: () => void;
  closeExplore: () => void;
}
const CafeContext = createContext<CafeState | null>(null);

function savedBasket(): Selection[] {
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem("tempo-basket") || "[]",
    );
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (item) =>
        typeof item?.menuItem === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 20,
    );
  } catch {
    return [];
  }
}

export function CafeProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [basket, setBasket] = useState<Selection[]>(savedBasket);
  const [notice, setNotice] = useState("");
  const [exploreOpen, setExploreOpen] = useState(false);
  useEffect(() => {
    let current = true;
    localStorage.removeItem("tempo-profile");
    setError("");
    const restoringToken = localStorage.getItem("tempo-token");
    if (!restoringToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    cafeApi
      .me()
      .then((profile) => {
        if (current && restoringToken === localStorage.getItem("tempo-token"))
          setUser(profile);
      })
      .catch((reason) => {
        if (current && restoringToken === localStorage.getItem("tempo-token")) {
          setUser(null);
          if (localStorage.getItem("tempo-token"))
            setError(errorMessage(reason));
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [version]);
  useEffect(() => {
    const expire = () => {
      setUser(null);
      setBasket([]);
      setError("");
    };
    window.addEventListener("tempo-login-expired", expire);
    return () => window.removeEventListener("tempo-login-expired", expire);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("tempo-basket", JSON.stringify(basket));
  }, [basket]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function login(email: string, password: string) {
    const result = await cafeApi.login(email, password);
    acceptLogin(result);
  }
  async function signup(
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) {
    await cafeApi.signup(name, email, password, confirmPassword);
  }
  function acceptLogin(result: { token: string; user: User }) {
    if (result.user._id !== user?._id) setBasket([]);
    localStorage.setItem("tempo-token", result.token);
    setUser(result.user);
    setError("");
    setLoading(false);
  }
  async function leave(beforeClear?: () => void) {
    try {
      if (localStorage.getItem("tempo-token")) await cafeApi.logout();
    } finally {
      // Leave protected routes before clearing the user and remounting the draft provider.
      beforeClear?.();
      localStorage.removeItem("tempo-token");
      setUser(null);
      setBasket([]);
      setError("");
      setLoading(false);
    }
  }
  function setQuantity(menuItem: string, quantity: number) {
    setBasket((current) => {
      const rest = current.filter((item) => item.menuItem !== menuItem);
      return quantity > 0
        ? [...rest, { menuItem, quantity: Math.min(20, quantity) }]
        : rest;
    });
  }

  return (
    <CafeContext.Provider
      value={{
        user,
        loading,
        error,
        retry: () => setVersion((value) => value + 1),
        login,
        updateProfile: async (displayName) => {
          const profile = await cafeApi.updateProfile(displayName);
          setUser((current) =>
            current?._id === profile._id ? profile : current,
          );
        },
        signup,
        leave,
        basket,
        setQuantity,
        selectOnly: (menuItem) => setBasket([{ menuItem, quantity: 1 }]),
        clearBasket: () => setBasket([]),
        notice,
        notify: setNotice,
        exploreOpen,
        openExplore: () => setExploreOpen(true),
        closeExplore: () => setExploreOpen(false),
      }}
    >
      {children}
    </CafeContext.Provider>
  );
}

export function useCafe() {
  const context = useContext(CafeContext);
  if (!context) throw new Error("useCafe must be used inside CafeProvider");
  return context;
}
