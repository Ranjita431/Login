import { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import "./App.css";

const clientId =
  "484994562541-otpt7tlqq44c1lcacps3qq6bvsua6him.apps.googleusercontent.com";

function App() {
  // --------------------------------------------------
  // GENERAL STATE
  // --------------------------------------------------

  const [user, setUser] = useState(null);
  const [page, setPage] = useState("login");

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
  const [resetStep, setResetStep] = useState(1);

  const [showNewPassword, setShowNewPassword] = useState(false);

  // --------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed"
        );
      }

      setUser(data.user);

    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.message ||
        "Google login failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // EMAIL LOGIN
  // --------------------------------------------------

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed"
        );
      }

      setUser(data.user);

      setEmail("");
      setPassword("");

    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // SIGN UP
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
      const response = await fetch(
        "http://localhost:8000/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Signup failed"
        );
      }

      alert("Account created successfully! 🎉");

      // Clear signup form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Go back to login
      setPage("login");

    } catch (error) {
      console.error("Signup error:", error);

      alert(
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FORGOT PASSWORD - STEP 1
  // --------------------------------------------------

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: resetEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to reset password"
        );
      }

      // The reset code is now sent to the user's email.
      // The backend does not return the code directly.
      alert(
        data.message ||
        "Password reset code sent to your email. Please check your inbox."
      );

      setResetStep(2);

    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      alert(
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RESET PASSWORD - STEP 2
  // --------------------------------------------------

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetCode || !newPassword) {
      alert(
        "Please enter the reset code and new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      alert(
        "New password must be at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: resetEmail,
            code: resetCode,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Password reset failed"
        );
      }

      alert(
        "Password reset successfully! 🎉"
      );

      // Clear reset fields
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setResetStep(1);

      // Go back to login
      setPage("login");

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      alert(
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = () => {
    setUser(null);
    setPage("login");
  };

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  if (user) {
    return (
      <div className="login-page">

        <div className="login-card dashboard-card">

          <div className="logo">✦</div>

          <h1>
            Welcome, {user.name}!
          </h1>

          <p className="subtitle">
            You have successfully logged in.
          </p>

          {user.picture && (
            <img
              className="profile-picture"
              src={user.picture}
              alt="Profile"
            />
          )}

          <p className="user-email">
            {user.email}
          </p>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>
    );
  }

  // --------------------------------------------------
  // FORGOT PASSWORD PAGE
  // --------------------------------------------------

  if (page === "forgot-password") {
    return (
      <GoogleOAuthProvider clientId={clientId}>

        <div className="login-page">

          <div className="login-card">

            <div className="logo">✦</div>

            {resetStep === 1 ? (
              <>
                <h1>Forgot Password?</h1>

                <p className="subtitle">
                  Enter your email to reset your password
                </p>

                <form onSubmit={handleForgotPassword}>

                  <div className="input-group">

                    <label>
                      Email address
                    </label>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) =>
                        setResetEmail(e.target.value)
                      }
                    />

                  </div>

                  <button
                    type="submit"
                    className="signin-button"
                    disabled={loading}
                  >
                    {loading
                      ? "Sending Code..."
                      : "Send Reset Code"}
                  </button>

                </form>

                <p className="signup-text">

                  Remember your password?{" "}

                  <button
                    type="button"
                    className="signup-link"
                    onClick={() => {
                      setResetEmail("");
                      setPage("login");
                    }}
                  >
                    Sign in
                  </button>

                </p>
              </>
            ) : (
              <>
                <h1>Reset Password</h1>

                <p className="subtitle">
                  Enter the reset code and create a new password
                </p>

                <form onSubmit={handleResetPassword}>

                  <div className="input-group">

                    <label>
                      Reset code
                    </label>

                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={resetCode}
                      onChange={(e) =>
                        setResetCode(e.target.value)
                      }
                    />

                  </div>

                  <div className="input-group">

                    <label>
                      New password
                    </label>

                    <div className="password-wrapper">

                      <input
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Create a new password"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(e.target.value)
                        }
                      />

                      <button
                        type="button"
                        className="show-password"
                        onClick={() =>
                          setShowNewPassword(
                            !showNewPassword
                          )
                        }
                      >
                        {showNewPassword
                          ? "Hide"
                          : "Show"}
                      </button>

                    </div>

                  </div>

                  <button
                    type="submit"
                    className="signin-button"
                    disabled={loading}
                  >
                    {loading
                      ? "Resetting Password..."
                      : "Reset Password"}
                  </button>

                </form>

                <p className="signup-text">

                  Didn't receive a code?{" "}

                  <button
                    type="button"
                    className="signup-link"
                    onClick={() => {
                      setResetCode("");
                      setResetStep(1);
                    }}
                  >
                    Try again
                  </button>

                </p>
              </>
            )}

            <p className="footer-text">
              Secure authentication powered by Google
            </p>

          </div>

        </div>

      </GoogleOAuthProvider>
    );
  }

  // --------------------------------------------------
  // SIGNUP PAGE
  // --------------------------------------------------

  if (page === "signup") {
    return (
      <GoogleOAuthProvider clientId={clientId}>

        <div className="login-page">

          <div className="login-card">

            <div className="logo">✦</div>

            <h1>Create Account</h1>

            <p className="subtitle">
              Create your account to get started
            </p>

            <form onSubmit={handleSignup}>

              <div className="input-group">

                <label>
                  Full name
                </label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Email address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Password
                </label>

                <div className="password-wrapper">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              <div className="input-group">

                <label>
                  Confirm password
                </label>

                <div className="password-wrapper">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              <button
                type="submit"
                className="signin-button"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="google-login">

              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  console.log(
                    "Google Signup Failed"
                  );
                }}
              />

            </div>

            <p className="signup-text">

              Already have an account?{" "}

              <button
                type="button"
                className="signup-link"
                onClick={() =>
                  setPage("login")
                }
              >
                Sign in
              </button>

            </p>

            <p className="footer-text">
              Secure authentication powered by Google
            </p>

          </div>

        </div>

      </GoogleOAuthProvider>
    );
  }

  // --------------------------------------------------
  // LOGIN PAGE
  // --------------------------------------------------

  return (
    <GoogleOAuthProvider clientId={clientId}>

      <div className="login-page">

        <div className="login-card">

          <div className="logo">✦</div>

          <h1>Welcome Back</h1>

          <p className="subtitle">
            Sign in to continue to your account
          </p>

          <form onSubmit={handleEmailLogin}>

            <div className="input-group">

              <label>
                Email address
              </label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>

            <div className="input-group">

              <div className="password-label">

                <label>
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => {
                    setResetEmail(email);
                    setResetStep(1);
                    setPage("forgot-password");
                  }}
                >
                  Forgot password?
                </button>

              </div>

              <div className="password-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

            <button
              type="submit"
              className="signin-button"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="google-login">

            {loading ? (
              <p>
                Signing you in...
              </p>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  console.log(
                    "Google Login Failed"
                  );
                }}
              />
            )}

          </div>

          <p className="signup-text">

            Don't have an account?{" "}

            <button
              type="button"
              className="signup-link"
              onClick={() =>
                setPage("signup")
              }
            >
              Sign up
            </button>

          </p>

          <p className="footer-text">
            Secure authentication powered by Google
          </p>

        </div>

      </div>

    </GoogleOAuthProvider>
  );
}

export default App;