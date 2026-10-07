import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { Modal } from "../components/Modal";

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}
type Confirm = (options: ConfirmationOptions) => Promise<boolean>;
const Context = createContext<Confirm | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmationOptions | null>(null);
  const resolvePending = useRef<((confirmed: boolean) => void) | null>(null);
  const messageId = useId();
  const cancelButton = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const settle = useCallback((confirmed: boolean) => {
    const resolve = resolvePending.current;
    resolvePending.current = null;
    setRequest(null);
    resolve?.(confirmed);
  }, []);
  const confirm = useCallback<Confirm>((options) => {
    if (resolvePending.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      resolvePending.current = resolve;
      setRequest(options);
    });
  }, []);

  useEffect(() => {
    settle(false);
  }, [location.key, settle]);
  useEffect(
    () => () => {
      resolvePending.current?.(false);
      resolvePending.current = null;
    },
    [],
  );

  return (
    <Context.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(request)}
        title={request?.title || "Confirm action"}
        descriptionId={messageId}
        initialFocusRef={cancelButton}
        onClose={() => settle(false)}
        className="confirmation-modal"
      >
        <p id={messageId} className="confirmation-message">
          {request?.message}
        </p>
        <div className="confirmation-actions">
          <button
            type="button"
            className="button secondary"
            ref={cancelButton}
            onClick={() => settle(false)}
          >
            {request?.cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            className={`button ${request?.destructive ? "confirmation-danger" : ""}`}
            onClick={() => settle(true)}
          >
            {request?.confirmLabel || "Confirm"}
          </button>
        </div>
      </Modal>
    </Context.Provider>
  );
}

export function useConfirmation() {
  const confirm = useContext(Context);
  if (!confirm) throw new Error("Confirmation provider is missing");
  return confirm;
}
