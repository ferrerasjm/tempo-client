import { useEffect, useRef, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { artwork } from "../assets";
import { PageHeading } from "../components/ui";
import { PageNavigation } from "../state/SessionNavigation";
import { useCafe } from "../state/CafeContext";
import { errorMessage } from "../api/http";

type AccountField = "name" | "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<AccountField, string>>;

function validateAccount(form: HTMLFormElement, signup: boolean): FieldErrors {
  const fields = new FormData(form);
  const name = String(fields.get("name") || "").trim();
  const email = String(fields.get("email") || "").trim();
  const password = String(fields.get("password") || "");
  const confirmation = String(fields.get("confirmPassword") || "");
  const errors: FieldErrors = {};
  if (signup && !name) errors.name = "Please enter your full name.";
  else if (signup && name.length > 100) errors.name = "Name must be 100 characters or fewer.";
  if (!email) errors.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    form.querySelector<HTMLInputElement>("[name=email]")?.validity.typeMismatch) {
    errors.email = "Please enter a valid email address.";
  } else if (email.length > 254) errors.email = "Email must be 254 characters or fewer.";
  if (!password) errors.password = "Please enter your password.";
  else if (signup && password.length < 8) errors.password = "Password must contain at least 8 characters.";
  else if (password.length > 1024) errors.password = "Password must be 1024 characters or fewer.";
  if (signup && !confirmation) errors.confirmPassword = "Please confirm your password.";
  else if (signup && password !== confirmation) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

function InputError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="account-field-error" role="alert">{message}</p> : null;
}

export function LandingPage() {
  return (
    <section className="entrance gif-entrance">
      <Link
        className="entrance-art"
        to="/welcome"
        aria-label="Enter Cafe Tempo"
        data-tooltip="ready to lock in?"
      >
        <img
          src={artwork.entrance}
          width={1440}
          height={800}
          alt="An animated pixel-art cafe surrounded by greenery, with cats sitting by the entrance."
        />
      </Link>
    </section>
  );
}

export function WelcomePage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const cafe = useCafe();
  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "login" && signupSuccess && !submitting) {
      formRef.current?.querySelector<HTMLInputElement>("[name=password]")?.focus();
    }
  }, [mode, signupSuccess, submitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const fields = new FormData(event.currentTarget);
    const form = event.currentTarget;
    setMessage("");
    setSignupSuccess(false);
    const validation = validateAccount(event.currentTarget, mode === "signup");
    setErrors(validation);
    const firstError = Object.keys(validation)[0];
    if (firstError) {
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${firstError}"]`)?.focus();
      return;
    }
    const password = String(fields.get("password"));
    const confirmPassword = String(fields.get("confirmPassword"));
    setSubmitting(true);
    try {
      const email = String(fields.get("email")).trim();
      if (mode === "signup") {
        await cafe.signup(String(fields.get("name")).trim(), email, password, confirmPassword);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          await form.animate([
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-8px)" },
          ], { duration: 180, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
        }
        setRegisteredEmail(email);
        setErrors({});
        setSignupSuccess(true);
        setMode("login");
      } else {
        await cafe.login(email, password);
        navigate("/study/drink");
      }
    } catch (reason) {
      const field = isAxiosError(reason) ? reason.response?.data?.field : undefined;
      if (["name", "email", "password", "confirmPassword"].includes(field)) {
        setErrors({ [field]: errorMessage(reason) });
      } else {
        setMessage(errorMessage(reason));
      }
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section className="page narrow welcome-page">
      <PageNavigation to="/" label="Back to Cafe Entrance" />
      <div className="pixel-auth-switch" role="group" aria-label="Account access">
        <button
          type="button"
          className={mode === "login" ? "is-selected" : ""}
          aria-pressed={mode === "login"}
          disabled={submitting}
          onClick={() => { setMode("login"); setMessage(""); setErrors({}); setSignupSuccess(false); }}
        >
          Log In
        </button>
        <button
          type="button"
          className={mode === "signup" ? "is-selected" : ""}
          aria-pressed={mode === "signup"}
          disabled={submitting}
          onClick={() => { setMode("signup"); setMessage(""); setErrors({}); setSignupSuccess(false); }}
        >
          Sign Up
        </button>
      </div>
      <PageHeading
        eyebrow="Before you settle in"
        title="Wait a Latte! Almost In..."
        description={`${mode === "signup" ? "Create account first" : "Log in first"}, before we save you a cozy spot ₊˚⊹`}
      />
      <form key={mode} ref={formRef} className="welcome-login" onSubmit={handleSubmit} aria-busy={submitting} noValidate
        onBlur={(event) => {
          const input = event.target;
          if (!(input instanceof HTMLInputElement) || !input.form) return;
          const name = input.name as AccountField;
          const validation = validateAccount(input.form, mode === "signup");
          setErrors((current) => ({ ...current, [name]: validation[name] }));
        }}
        onChange={(event) => {
          const input = event.target;
          if (!(input instanceof HTMLInputElement) || !input.form) return;
          const name = input.name as AccountField;
          const validation = validateAccount(input.form, mode === "signup");
          setMessage("");
          setErrors((current) => ({
            ...current,
            [name]: current[name] ? validation[name] : undefined,
            ...(name === "password" && current.confirmPassword
              ? { confirmPassword: validation.confirmPassword } : {}),
          }));
        }}>
        {signupSuccess && (
          <p className="account-success" role="status">Account created successfully. Please log in to continue.</p>
        )}
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="signup-name">Name</label>
            <input id="signup-name" name="name" type="text" autoComplete="name"
              placeholder="Enter your full name" required maxLength={100} disabled={submitting}
              aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
            <InputError id="name-error" message={errors.name} />
          </div>
        )}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete={mode === "signup" ? "email" : "username"}
            placeholder="Enter your email address"
            defaultValue={mode === "login" ? registeredEmail : ""}
            required
            maxLength={254}
            disabled={submitting}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          <InputError id="email-error" message={errors.email} />
        </div>
        <PasswordField name="password" label="Password" disabled={submitting}
          signup={mode === "signup"} error={errors.password} />
        {mode === "signup" && (
          <PasswordField name="confirmPassword" label="Confirm Password"
            disabled={submitting} signup error={errors.confirmPassword} />
        )}
        <button className="pixel-enter" type="submit" disabled={submitting}>
          {submitting ? mode === "signup" ? "Creating…" : "Entering…" : "Enter"}
        </button>
        {message && <p className="login-message form-error" role="alert">{message}</p>}
      </form>
    </section>
  );
}

function PasswordField({ name, label, disabled, signup, error }: {
  name: string; label: string; disabled: boolean; signup: boolean; error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const id = `account-${name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input id={id} name={name} type={visible ? "text" : "password"}
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder={name === "confirmPassword" ? "Confirm your password" : signup ? "Create a password (at least 8 characters)" : "Enter your password"}
          required minLength={signup ? 8 : undefined} maxLength={1024} disabled={disabled}
          aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <button className="password-toggle" type="button" disabled={disabled}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible} aria-controls={id} onClick={() => setVisible((value) => !value)}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinejoin="miter">
            <path d="M2 10h2V8h3V6h10v2h3v2h2v4h-2v2h-3v2H7v-2H4v-2H2z" />
            <path d="M10 9h4v6h-4z" fill="currentColor" stroke="none" />
            {visible && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
      <InputError id={`${id}-error`} message={error} />
    </div>
  );
}
