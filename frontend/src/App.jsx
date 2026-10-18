import { useEffect, useState } from "react";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./App.css";
import API_URL from "./services/api";
import { login, signup, googleLogin } from "./services/auth";

const clientId =
  "484994562541-otpt7tlqq44c1lcacps3qq6bvsua6him.apps.googleusercontent.com";


// --------------------------------------------------
// BRAND PANEL
// --------------------------------------------------



// --------------------------------------------------
// AUTH CARD
// --------------------------------------------------


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
  return <Dashboard user={user} onLogout={handleLogout} />;
}

  // --------------------------------------------------
  // FORGOT / RESET PASSWORD
  // --------------------------------------------------

if (page === "forgot-password") {
  return (
    <ForgotPassword
      resetStep={resetStep}
      setResetStep={setResetStep}
      resetEmail={resetEmail}
      setResetEmail={setResetEmail}
      resetCode={resetCode}
      setResetCode={setResetCode}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      showNewPassword={showNewPassword}
      setShowNewPassword={setShowNewPassword}
      loading={loading}
      handleForgotPassword={handleForgotPassword}
      handleResetPassword={handleResetPassword}
      backToLogin={backToLogin}
    />
  );
}
  // --------------------------------------------------
  // SIGNUP PAGE
  // --------------------------------------------------

if (page === "signup") {
  return (
    <Signup
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      loading={loading}
      handleSignup={handleSignup}
      handleGoogleLogin={handleGoogleLogin}
      setPage={setPage}
    />
  );
}
  // --------------------------------------------------
  // LOGIN PAGE
  // --------------------------------------------------

  return (
    <Login
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      loading={loading}
      handleEmailLogin={handleEmailLogin}
      startForgotPassword={startForgotPassword}
      handleGoogleLogin={handleGoogleLogin}
      setPage={setPage}
    />
  );

// --------------------------------------------------
// GOOGLE PROVIDER
// --------------------------------------------------
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