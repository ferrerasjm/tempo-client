import { cloneElement, useId, type ReactElement, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="lede">{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function LoadState({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
  children: ReactNode;
}) {
  if (loading)
    return (
      <p className="loading" role="status">
        Opening the cafe…
      </p>
    );
  if (error)
    return (
      <div className="empty">
        <p role="alert">{error}</p>
        <button className="button secondary" onClick={retry}>
          Try Again
        </button>
      </div>
    );
  return <>{children}</>;
}
export function EmptyState({
  title,
  children,
  to,
  label,
}: {
  title: string;
  children?: ReactNode;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {to && (
        <Link className="button" to={to}>
          {label}
        </Link>
      )}
    </div>
  );
}
export function Feedback({ error }: { error: string }) {
  return error ? (
    <p className="form-error" role="alert">
      {error}
    </p>
  ) : null;
}
export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const id = useId();
  const control = children as ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
  const descriptions = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(control, {
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": descriptions || undefined,
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small id={`${id}-error`} className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value}`}>{value.replace("_", " ")}</span>
  );
}
