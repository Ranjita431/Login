
import { AuthCard, CheckIcon } from "../components/AuthUI";
import "../App.css";

export default function Dashboard({ user, onLogout }) {
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

        <button className="primary-button" onClick={onLogout}>
          Logout
        </button>
      </AuthCard>
    </div>
  );
}