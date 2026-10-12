import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileNameSchema, type ProfileNameValues } from "../schemas/forms";
import { errorMessage } from "../api/http";
import { artwork } from "../assets";
import { useCafe } from "../state/CafeContext";
import { OrdersPage } from "../pages/MenuPages";
import { FocusHistoryPage, AnalyticsPage } from "../pages/ProfileActivityPages";
import { Modal } from "./Modal";

export type AvatarColor = keyof typeof artwork.profileAvatars;
const tabs = ["Profile", "My Orders", "Focus History", "Productivity Stats"] as const;
type ProfileTab = typeof tabs[number];

export function ProfilePanel({ avatar, onAvatarChange, onNavigate, navigating, busy, onBusyChange }: {
  avatar: AvatarColor;
  onAvatarChange: (color: AvatarColor) => void;
  onNavigate: (to: string) => Promise<void>;
  navigating: boolean;
  busy: boolean;
  onBusyChange: (value: boolean) => void;
}) {
  const { user } = useCafe();
  const [tab, setTab] = useState<ProfileTab>("Profile");
  const [choosingAvatar, setChoosingAvatar] = useState(false);
  const id = useId();
  if (!user) return null;
  return <>
    <div className="profile-panel-tabs" role="tablist" aria-label="Your cafe profile">
      {tabs.map((label, index) => <button type="button" key={label} role="tab"
        id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
        aria-selected={tab === label} tabIndex={tab === label ? 0 : -1} disabled={busy}
        onClick={() => setTab(label)} onKeyDown={(event) => {
          let next = index;
          if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
          else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = tabs.length - 1;
          else return;
          event.preventDefault();
          setTab(tabs[next]);
          document.getElementById(`${id}-tab-${next}`)?.focus();
        }}>{label}</button>)}
    </div>
    <div className="profile-panel-body">
      {tabs.map((label, index) => <div key={label} role="tabpanel" id={`${id}-panel-${index}`}
        aria-labelledby={`${id}-tab-${index}`} hidden={tab !== label} tabIndex={0}>
      {tab === label && (label === "Profile" ? <div className="profile-welcome-card">
        <div className="profile-card-content">
        <div className="profile-card-caption"><span className="profile-heading-heart" aria-hidden="true">♥</span><h3>My Profile</h3><span className="profile-heading-heart" aria-hidden="true">♥</span></div>
        <div className="profile-panel-identity">
        <div className="profile-avatar-picker">
          <svg className="profile-portrait-sparkle profile-portrait-sparkle-top" width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6 0h4v4h2v2h4v4h-4v2h-2v4H6v-4H4v-2H0V6h4V4h2z" /></svg>
          <button type="button" className="profile-avatar-preview" aria-label="Change avatar"
            aria-haspopup="dialog"
            onClick={() => setChoosingAvatar(true)}>
            <img src={artwork.profileAvatars[avatar]} alt={`${avatar} avatar`} width={96} height={96} />
            <span className="profile-avatar-hover-label">Change Avatar</span>
          </button>
          <svg className="profile-portrait-sparkle profile-portrait-sparkle-bottom" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6 0h4v4h2v2h4v4h-4v2h-2v4H6v-4H4v-2H0V6h4V4h2z" /></svg>
        </div>
        <dl className="profile-panel-name profile-card-details">
          <div><dt>Name</dt><dd><InlineProfileName busy={busy} onBusyChange={onBusyChange} /></dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
        </dl>
        </div>
        </div>
      </div>
          : label === "My Orders" ? <OrdersPage embedded onBusyChange={onBusyChange} onNavigate={onNavigate} navigating={navigating} />
          : label === "Focus History" ? <FocusHistoryPage embedded />
          : <AnalyticsPage embedded />)}
      </div>)}
    </div>
    {choosingAvatar && <AvatarChooser avatar={avatar} onClose={() => setChoosingAvatar(false)}
      onSave={(color) => { onAvatarChange(color); setChoosingAvatar(false); }} />}
  </>;
}

function InlineProfileName({ busy, onBusyChange }: {
  busy: boolean;
  onBusyChange: (value: boolean) => void;
}) {
  const { user, updateProfile } = useCafe();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const { register, handleSubmit, reset, setFocus, setError, clearErrors,
    formState: { errors, isSubmitting } } = useForm<ProfileNameValues>({
    resolver: zodResolver(profileNameSchema),
    mode: "onChange",
    defaultValues: { name: "" },
  });
  const error = errors.name?.message;
  const saving = busy || isSubmitting;
  useEffect(() => {
    if (editing) setFocus("name", { shouldSelect: true });
  }, [editing, setFocus]);
  const finishEditing = () => {
    setEditing(false);
    window.requestAnimationFrame(() => editButton.current?.focus());
  };
  return <>
    {editing ? <form className="profile-name-editor" noValidate onSubmit={handleSubmit(async (values) => {
      if (busy) return;
      onBusyChange(true);
      try {
        await updateProfile(values.name);
        setSaved(true);
        finishEditing();
      } catch (reason) { setError("name", { type: "server", message: errorMessage(reason) }); }
      finally { onBusyChange(false); }
    })}>
      <input {...register("name")} aria-label="Your name" maxLength={100} autoComplete="name"
        disabled={saving} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            if (!saving) { clearErrors(); finishEditing(); }
          }
        }} />
      <button type="submit" className="profile-name-check" aria-label={saving ? "Saving name" : "Save name"}
        title="Save name" disabled={saving}>
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M12 2h3v3h-2v2h-2v2H9v2H7v2H4v-2H2V9H0V6h3v2h2v2h1V8h2V6h2V4h2z" /></svg>
      </button>
    </form> : <div className="profile-name-row">
      <h3>{user?.displayName}</h3>
      <button ref={editButton} type="button" className="profile-name-pencil" aria-label="Edit name"
        title="Edit name" disabled={busy} onClick={() => {
          reset({ name: user?.displayName || "" }); setSaved(false); setEditing(true);
        }}>
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11 1h2v1h1v1h1v2h-1v1h-1V5h-1V4h-1V3h-1V2h1zM9 3h1v1h1v1h1v1h1v1l-7 7H2v-4zM3 11v2h2z" /></svg>
      </button>
    </div>}
    {error && <p className="profile-name-error" id={`${id}-error`} role="alert">{error}</p>}
    {saved && <span className="profile-name-saved" role="status">Name saved.</span>}
  </>;
}

function AvatarChooser({ avatar, onClose, onSave }: {
  avatar: AvatarColor;
  onClose: () => void;
  onSave: (color: AvatarColor) => void;
}) {
  const [selected, setSelected] = useState<AvatarColor>(avatar);
  return <Modal open title="Change Avatar" onClose={onClose} className="profile-panel-modal avatar-chooser-modal">
    <p className="avatar-chooser-intro">Pick a little companion for your cafe visits.</p>
    <div className="avatar-chooser-preview" aria-live="polite">
      <div className="avatar-chooser-frame"><img src={artwork.profileAvatars[selected]} alt={`${selected} avatar preview`} width={160} height={160} /></div>
    </div>
    <div className="avatar-chooser-options" role="group" aria-label="Choose your avatar">
      {(Object.keys(artwork.profileAvatars) as AvatarColor[]).map((color) => <button type="button" key={color}
        aria-pressed={selected === color} onClick={() => setSelected(color)}>
        <img src={artwork.profileAvatars[color]} alt="" width={80} height={80} />
        <span className="avatar-color-name">{color}</span>
        <span className="avatar-option-status">{color === avatar ? "Current" : selected === color ? "Selected" : ""}</span>
      </button>)}
    </div>
    <div className="avatar-chooser-actions">
      <button type="button" className="avatar-chooser-save" onClick={() => onSave(selected)}>Save Avatar</button>
    </div>
  </Modal>;
}
