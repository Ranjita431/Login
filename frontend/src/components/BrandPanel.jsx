
const content = {
  login: {
    title: "Welcome back!",
    text: "Sign in to access your account and continue your journey.",
  },
  signup: {
    title: "Create your account",
    text: "Join us and get started on your secure journey.",
  },
  forgot: {
    title: "Reset your password",
    text: "Enter your email address and we'll send you a reset code.",
  },
  reset: {
    title: "Set a new password",
    text: "Enter your new password below to regain access to your account.",
  },
};

export default function BrandPanel({ mode = "login" }) {
  const current = content[mode] || content.login;

  return (
    <div className="brand-panel">
      <div className="brand">
        <div className="brand-mark">
          <span>✦</span>
        </div>

        <div>
          <div className="brand-name">AuthFlow</div>
          <div className="brand-tagline">Secure. Simple. Yours.</div>
        </div>
      </div>

      <div className="brand-copy">
        <h2>{current.title}</h2>
        <p>{current.text}</p>
      </div>

      <div className="mountains">
        <div className="mountain mountain-back" />
        <div className="mountain mountain-middle" />
        <div className="mountain mountain-front" />
      </div>
    </div>
  );
}