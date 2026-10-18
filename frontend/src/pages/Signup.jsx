import { GoogleLogin } from "@react-oauth/google";
import BrandPanel from "../components/BrandPanel";
import {
AuthCard,
LockIcon,
MailIcon,
UserIcon,
EyeIcon,
} from "../components/AuthUI";

export default function Signup({
name,
setName,
email,
setEmail,
password,
setPassword,
confirmPassword,
setConfirmPassword,
showPassword,
setShowPassword,
showConfirmPassword,
setShowConfirmPassword,
loading,
handleSignup,
handleGoogleLogin,
setPage,
}) {
return ( <div className="app-page"> <div className="auth-layout"> <BrandPanel mode="signup" />


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
