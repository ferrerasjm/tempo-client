import { useEffect, useRef, useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { artwork } from "../assets";
import { PageHeading } from "../components/ui";
import { PageNavigation } from "../state/SessionNavigation";
import { useCafe } from "../state/CafeContext";
import { errorMessage } from "../api/http";
import { loginSchema, signupSchema, type AccountValues } from "../schemas/forms";

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
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const cafe = useCafe();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setError, setFocus,
    formState: { errors, isSubmitting: submitting } } = useForm<AccountValues>({
    resolver: zodResolver(mode === "signup" ? signupSchema : loginSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (mode === "login" && signupSuccess && !submitting) {
      setFocus("password");
    }
  }, [mode, signupSuccess, submitting, setFocus]);

  function switchMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    reset({ name: "", email: nextMode === "login" ? registeredEmail : "", password: "", confirmPassword: "" });
    setMessage("");
    setSignupSuccess(false);
  }

  async function submit(values: AccountValues) {
    setMessage("");
    setSignupSuccess(false);
    try {
      const { name, email, password, confirmPassword } = values;
      if (mode === "signup") {
        await cafe.signup(name, email, password, confirmPassword);
        if (formRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          await formRef.current.animate([
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-8px)" },
          ], { duration: 180, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
        }
        setRegisteredEmail(email);
        reset({ name: "", email, password: "", confirmPassword: "" });
        setSignupSuccess(true);
        setMode("login");
      } else {
        await cafe.login(email, password);
        navigate("/study/drink");
      }
    } catch (reason) {
      const field = isAxiosError(reason) ? reason.response?.data?.field : undefined;
      if (field === "name" || field === "email" || field === "password" || field === "confirmPassword") {
        setError(field, { type: "server", message: errorMessage(reason) });
      } else {
        setMessage(errorMessage(reason));
      }
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
          onClick={() => switchMode("login")}
        >
          Log In
        </button>
        <button
          type="button"
          className={mode === "signup" ? "is-selected" : ""}
          aria-pressed={mode === "signup"}
          disabled={submitting}
          onClick={() => switchMode("signup")}
        >
          Sign Up
        </button>
      </div>
      <PageHeading
        eyebrow="Before you settle in"
        title="Wait a Latte! Almost In..."
        description={`${mode === "signup" ? "Create account first" : "Log in first"}, before we save you a cozy spot ₊˚⊹`}
      />
      <form key={mode} ref={formRef} className="welcome-login flex w-full min-w-0 flex-col items-stretch gap-4 sm:gap-5"
        onSubmit={handleSubmit(submit, () => { setMessage(""); setSignupSuccess(false); })}
        aria-busy={submitting} noValidate onChange={() => setMessage("")}>
        {signupSuccess && (
          <p className="account-success" role="status">Account created successfully. Please log in to continue.</p>
        )}
        {mode === "signup" && (
          <div className="field">
            <label htmlFor="signup-name">Name</label>
            <input id="signup-name" {...register("name")} type="text" autoComplete="name"
              placeholder="Enter your full name" required maxLength={100} disabled={submitting}
              aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
            <InputError id="name-error" message={errors.name?.message} />
          </div>
        )}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            {...register("email")}
            type="email"
            autoComplete={mode === "signup" ? "email" : "username"}
            placeholder="Enter your email address"
            required
            maxLength={254}
            disabled={submitting}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          <InputError id="email-error" message={errors.email?.message} />
        </div>
        <PasswordField name="password" label="Password" disabled={submitting}
          signup={mode === "signup"} error={errors.password?.message} register={register} />
        {mode === "signup" && (
          <PasswordField name="confirmPassword" label="Confirm Password"
            disabled={submitting} signup error={errors.confirmPassword?.message} register={register} />
        )}
        <button className="pixel-enter" type="submit" disabled={submitting}>
          {submitting ? mode === "signup" ? "Creating…" : "Entering…" : "Enter"}
        </button>
        {message && <p className="login-message form-error" role="alert">{message}</p>}
      </form>
    </section>
  );
}

function PasswordField({ name, label, disabled, signup, error, register }: {
  name: "password" | "confirmPassword"; label: string; disabled: boolean; signup: boolean; error?: string;
  register: UseFormRegister<AccountValues>;
}) {
  const [visible, setVisible] = useState(false);
  const id = `account-${name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input id={id} {...register(name, name === "password" && signup ? { deps: "confirmPassword" } : undefined)} type={visible ? "text" : "password"}
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder={name === "confirmPassword" ? "Confirm password" : signup ? "Create a password" : "Enter your password"}
          required minLength={signup ? 8 : undefined} maxLength={1024} disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={[signup && name === "password" ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined} />
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
      {signup && name === "password" && <small id={`${id}-hint`} className="account-password-hint">Use at least 8 characters.</small>}
      <InputError id={`${id}-error`} message={error} />
    </div>
  );
}
