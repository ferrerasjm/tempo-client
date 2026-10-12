import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { artwork } from "../assets";
import { errorMessage } from "../api/http";
import { useCafe } from "../state/CafeContext";
import { Modal } from "./Modal";
import { ProfilePanel, type AvatarColor } from "./ProfilePanel";

export function SessionProfile({
  onNavigate,
  navigating = false,
}: {
  onNavigate: (to: string) => Promise<void>;
  navigating?: boolean;
}) {
  const { user, leave, notify } = useCafe();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState<AvatarColor>("purple");
  const root = useRef<HTMLDivElement>(null);
  const dropdownId = useId();
  useEffect(() => {
    const saved = user && localStorage.getItem(`tempo-avatar-${user._id}`);
    setAvatar(saved === "orange" || saved === "teal" ? saved : "purple");
  }, [user?._id]);
  useEffect(() => {
    if (!expanded) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [expanded]);
  if (!user) return null;
  return (
    <>
      <div
        className="session-profile"
        ref={root}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setExpanded(false);
            root.current?.querySelector("button")?.focus();
          }
        }}
      >
        <button
          type="button"
          className="session-profile-toggle"
          aria-label="Profile options"
          data-tooltip={expanded ? undefined : "Profile"}
          data-cursor-tooltip={expanded ? undefined : true}
          aria-expanded={expanded}
          aria-controls={dropdownId}
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="session-avatar">
            <img
              src={artwork.profileAvatars[avatar]}
              alt=""
              width={56}
              height={56}
            />
          </span>
          <span className="session-profile-name" title={user.displayName}>
            {user.displayName}
          </span>
          <svg
            className="profile-chevron"
            viewBox="0 0 12 8"
            aria-hidden="true"
          >
            <path d="M0 0h2v2H0zM2 2h2v2H2zM4 4h4v2H4zM8 2h2v2H8zM10 0h2v2h-2z" />
          </svg>
        </button>
        {expanded && (
          <div className="session-profile-dropdown" id={dropdownId}>
            <p className="session-profile-dropdown-name">{user.displayName}</p>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setEditing(true);
              }}
            >
              My Cafe
            </button>
            <button
              type="button"
              disabled={navigating || loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await leave(() =>
                    flushSync(() => navigate("/welcome", { replace: true })),
                  );
                } catch (reason) {
                  notify(errorMessage(reason));
                } finally {
                  setLoggingOut(false);
                }
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <Modal
        open={editing}
        title={
          <span className="my-cafe-title">
            <img src={artwork.cafeLogo} alt="" width={40} height={40} />
            <span>My Cafe</span>
          </span>
        }
        busy={busy}
        onClose={() => setEditing(false)}
        className="profile-panel-modal"
      >
        {editing && (
          <ProfilePanel
            avatar={avatar}
            busy={busy}
            onBusyChange={setBusy}
            onAvatarChange={(color) => {
              localStorage.setItem(`tempo-avatar-${user._id}`, color);
              setAvatar(color);
            }}
            onNavigate={async (to) => {
              await onNavigate(to);
              setEditing(false);
            }}
            navigating={navigating}
          />
        )}
      </Modal>
    </>
  );
}
