import { GoogleLogin } from "@react-oauth/google";
import BrandPanel from "../components/BrandPanel";
import {
AuthCard,
LockIcon,
MailIcon,
EyeIcon,
} from "../components/AuthUI";

export default function Login({
email,
setEmail,
password,
setPassword,
showPassword,
setShowPassword,
loading,
handleEmailLogin,
startForgotPassword,
handleGoogleLogin,
setPage,
}) {
return ( <div className="app-page"> <div className="auth-layout"> <BrandPanel mode="login" />

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
