
export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="field-icon" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="field-icon" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="field-icon" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.1-5.5 7-5.5s6.2 2 7 5.5" />
    </svg>
  );
}

export function EyeIcon({ hidden = false }) {
  return (
    <svg viewBox="0 0 24 24" className="eye-icon" aria-hidden="true">
      {hidden ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.3A10.7 10.7 0 0 1 12 4c5.3 0 8.7 5 9.5 6-.3.4-1.1 1.5-2.5 2.6" />
          <path d="M6.1 6.1C3.8 7.6 2.7 9.5 2.5 10c.8 1 4.2 6 9.5 6 1 0 2-.2 2.9-.5" />
        </>
      ) : (
        <>
          <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="success-check" aria-hidden="true">
      <path d="m7 12 3.2 3.2L17.5 8" />
    </svg>
  );
}

export function MailLargeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="mail-large-icon" aria-hidden="true">
      <rect x="8" y="14" width="48" height="36" rx="7" />
      <path d="m10 18 22 18 22-18" />
    </svg>
  );
}

export function AuthCard({ children, className = "" }) {
  return <div className={`auth-card ${className}`}>{children}</div>;
}