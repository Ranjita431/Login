
import { useEffect, useState } from "react";
import VerifyEmail from "./pages/VerifyEmail";
import {
  GoogleOAuthProvider,
  GoogleLogin,
} from "@react-oauth/google";
import "./App.css";
import API_URL from "./services/api";
import { login, signup, googleLogin } from "./services/auth";

const clientId =
  "484994562541-otpt7tlqq44c1lcacps3qq6bvsua6him.apps.googleusercontent.com";

// --------------------------------------------------
// ICONS
// --------------------------------------------------

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="field-icon" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="field-icon" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="field-icon" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.1-5.5 7-5.5s6.2 2 7 5.5" />
    </svg>
  );
}

function EyeIcon({ hidden = false }) {
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="success-check" aria-hidden="true">
      <path d="m7 12 3.2 3.2L17.5 8" />
    </svg>
  );
}

function MailLargeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="mail-large-icon" aria-hidden="true">
      <rect x="8" y="14" width="48" height="36" rx="7" />
      <path d="m10 18 22 18 22-18" />
    </svg>
  );
}

// --------------------------------------------------
// BRAND PANEL
// --------------------------------------------------

function BrandPanel({ mode = "login" }) {
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

// --------------------------------------------------
// AUTH CARD
// --------------------------------------------------

function AuthCard({ children, className = "" }) {
  return <div className={`auth-card ${className}`}>{children}</div>;
}

// --------------------------------------------------
// MAIN APP
// --------------------------------------------------

function App() {
  const isVerifyEmailPage =
    window.location.pathname === "/verify-email";

  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");

  // Authentication uses HttpOnly cookies, not localStorage.
  const clearAuth = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      return response.ok;
    } catch (error) {
      console.error("Session refresh failed:", error);
      return false;
    }
  };

  const authenticatedFetch = async (url, options = {}) => {
    const makeRequest = () =>
      fetch(url, {
        ...options,
        credentials: "include",
        headers: new Headers(options.headers || {}),
      });

    let response = await makeRequest();

    if (response.status === 401) {
      const refreshed = await refreshAccessToken();

      if (!refreshed) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      response = await makeRequest();
    }

    return response;
  };

  const loadCurrentUser = async () => {
    const response = await authenticatedFetch(`${API_URL}/users/me`, {
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to load user profile");
    }

    setUser(data);
    return data;
  };

  useEffect(() => {
    if (isVerifyEmailPage) return;

    const restoreSession = async () => {
      try {
        await loadCurrentUser();
      } catch {
        setUser(null);
      }
    };

    restoreSession();
  }, []);

  // --------------------------------------------------
  // LOGIN / SIGNUP STATE
  // --------------------------------------------------

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // FORGOT PASSWORD STATE
  // --------------------------------------------------

  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 1 = enter email
  // 2 = email sent
  // 3 = enter reset code + new password
  // 4 = success
  const [resetStep, setResetStep] = useState(1);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // --------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------

const handleGoogleLogin = async (credentialResponse) => {
  setLoading(true);

  try {
    const response = await googleLogin(credentialResponse.credential);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Google login failed");
    }

    await loadCurrentUser();
    setEmail("");
    setPassword("");
  } catch (error) {
    console.error("Google login error:", error);
    alert(error.message || "Google login failed. Please try again.");
  } finally {
    setLoading(false);
  }
};



  // --------------------------------------------------
  // EMAIL LOGIN — USING AUTH SERVICE
  // --------------------------------------------------

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      await loadCurrentUser();

      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Email login error:", error);
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // SIGNUP — USING AUTH SERVICE
  // --------------------------------------------------

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await signup(name, email, password);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed");
      }

      alert("Account created successfully! 🎉");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPage("login");
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FORGOT PASSWORD — STEP 1
  // --------------------------------------------------

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to reset password");
      }

      setResetStep(2);
    } catch (error) {
      console.error("Forgot password error:", error);
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RESET PASSWORD
  // --------------------------------------------------

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetCode || !newPassword) {
      alert("Please enter the reset code and new password.");
      return;
    }

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password reset failed");
      }

      setResetStep(4);
      setResetCode("");
      setNewPassword("");
    } catch (error) {
      console.error("Reset password error:", error);
      alert(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = async () => {
    await clearAuth();
    setPage("login");
  };

  // --------------------------------------------------
  // RESET FLOW
  // --------------------------------------------------

  const startForgotPassword = () => {
    setResetEmail(email);
    setResetCode("");
    setNewPassword("");
    setResetStep(1);
    setPage("forgot-password");
  };

  const backToLogin = () => {
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setResetStep(1);
    setPage("login");
  };

  // --------------------------------------------------
  // EMAIL VERIFICATION PAGE
  // --------------------------------------------------

  if (isVerifyEmailPage) {
    return <VerifyEmail />;
  }

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  if (user) {
    return (
      <div className="app-page dashboard-page">
        <div className="dashboard-background">
          <div className="soft-orb orb-one" />
          <div className="soft-orb orb-two" />
        </div>

        <AuthCard className="dashboard-card">
          <div className="success-logo">
            <CheckIcon />
          </div>

          <span className="eyebrow">AUTHENTICATED</span>
          <h1>Welcome, {user.name}!</h1>

          <p className="subtitle">
            You have successfully logged in to your account.
          </p>

          {user.picture && (
            <img
              className="profile-picture"
              src={user.picture}
              alt="Profile"
            />
          )}

          <div className="account-email">{user.email}</div>

          <button className="primary-button" onClick={handleLogout}>
            Logout
          </button>
        </AuthCard>
      </div>
    );
  }

  // --------------------------------------------------
  // FORGOT / RESET PASSWORD
  // --------------------------------------------------

  if (page === "forgot-password") {
    if (resetStep === 1) {
      return (
        <div className="app-page">
          <div className="auth-layout">
            <BrandPanel mode="forgot" />

            <AuthCard>
              <div className="mobile-brand">AuthFlow</div>
              <div className="card-icon">
                <MailIcon />
              </div>

              <h1>Forgot Password</h1>
              <p className="card-subtitle">
                We'll send a 6-digit code to your email
              </p>

              <form onSubmit={handleForgotPassword}>
                <div className="input-group">
                  <label>Email address</label>

                  <div className="input-wrapper">
                    <MailIcon />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? "Sending Code..." : "Send Reset Code"}
                </button>
              </form>

              <button
                type="button"
                className="back-link"
                onClick={backToLogin}
              >
                ← Back to login
              </button>
            </AuthCard>
          </div>
        </div>
      );
    }

    if (resetStep === 2) {
      return (
        <div className="app-page">
          <div className="auth-layout single-state">
            <AuthCard className="state-card">
              <div className="state-icon email-state">
                <MailLargeIcon />
                <span className="state-check">
                  <CheckIcon />
                </span>
              </div>

              <h1>Check your email</h1>
              <p className="card-subtitle">
                We've sent a 6-digit reset code to
              </p>
              <p className="reset-email-display">{resetEmail}</p>

              <div className="info-box">
                <span className="info-icon">i</span>
                <span>
                  The code will expire in 10 minutes and can only be used once.
                </span>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => setResetStep(3)}
              >
                Enter Reset Code
              </button>

              <button
                type="button"
                className="back-link"
                onClick={backToLogin}
              >
                ← Back to login
              </button>
            </AuthCard>
          </div>
        </div>
      );
    }

    if (resetStep === 3) {
      return (
        <div className="app-page">
          <div className="auth-layout">
            <BrandPanel mode="reset" />

            <AuthCard>
              <div className="mobile-brand">AuthFlow</div>
              <div className="card-icon">
                <LockIcon />
              </div>

              <h1>Reset Password</h1>
              <p className="card-subtitle">
                Enter the 6-digit code sent to your email and create a new
                password.
              </p>

              <form onSubmit={handleResetPassword}>
                <div className="input-group">
                  <label>Reset code</label>
                  <div className="input-wrapper">
                    <span className="code-symbol">#</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={resetCode}
                      onChange={(e) =>
                        setResetCode(e.target.value.replace(/\D/g, ""))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>New password</label>
                  <div className="input-wrapper">
                    <LockIcon />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Create a new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="eye-button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                    >
                      <EyeIcon hidden={!showNewPassword} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </button>
              </form>

              <button
                type="button"
                className="back-link"
                onClick={() => setResetStep(2)}
              >
                ← Back
              </button>
            </AuthCard>
          </div>
        </div>
      );
    }

    return (
      <div className="app-page success-page">
        <div className="auth-layout single-state">
          <AuthCard className="state-card success-card">
            <div className="success-logo large">
              <CheckIcon />
            </div>

            <h1>Password Reset Successful</h1>
            <p className="card-subtitle">
              Your password has been reset successfully. You can now log in
              with your new password.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={backToLogin}
            >
              Go to Login
            </button>
          </AuthCard>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // SIGNUP PAGE
  // --------------------------------------------------

  if (page === "signup") {
    return (
      <div className="app-page">
        <div className="auth-layout">
          <BrandPanel mode="signup" />

          <AuthCard>
            <div className="mobile-brand">AuthFlow</div>
            <h1>Create Account</h1>
            <p className="card-subtitle">
              Fill in your details to get started
            </p>

            <form onSubmit={handleSignup}>
              <div className="input-group">
                <label>Full name</label>
                <div className="input-wrapper">
                  <UserIcon />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Email address</label>
                <div className="input-wrapper">
                  <MailIcon />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <LockIcon />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm password</label>
                <div className="input-wrapper">
                  <LockIcon />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    <EyeIcon hidden={!showConfirmPassword} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="google-login">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => console.error("Google Signup Failed")}
                width="100%"
              />
            </div>

            <p className="switch-text">
              Already have an account?{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => setPage("login")}
              >
                Sign in
              </button>
            </p>
          </AuthCard>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // LOGIN PAGE
  // --------------------------------------------------

  return (
    <div className="app-page">
      <div className="auth-layout">
        <BrandPanel mode="login" />

        <AuthCard>
          <div className="mobile-brand">AuthFlow</div>
          <h1>Sign In</h1>
          <p className="card-subtitle">
            Enter your email and password to continue
          </p>

          <form onSubmit={handleEmailLogin}>
            <div className="input-group">
              <label>Email address</label>
              <div className="input-wrapper">
                <MailIcon />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="password-label">
                <label>Password</label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={startForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrapper">
                <LockIcon />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </div>
            </div>

            <div className="remember-row">
              <label className="remember-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="google-login">
            {loading ? (
              <p className="google-loading">Signing you in...</p>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => console.error("Google Login Failed")}
                width="100%"
              />
            )}
          </div>

          <p className="switch-text">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => setPage("signup")}
            >
              Sign up
            </button>
          </p>
        </AuthCard>
      </div>
    </div>
  );
}

// --------------------------------------------------
// GOOGLE PROVIDER
// --------------------------------------------------

export default function AppWithGoogle() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  );
}