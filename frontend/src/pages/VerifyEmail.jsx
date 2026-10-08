import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:8000";

function VerifyEmail() {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  const verificationStarted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);

      const token = params.get("token");
      const email = params.get("email");

      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/auth/verify-email?token=${encodeURIComponent(
            token
          )}&email=${encodeURIComponent(email)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Email verification failed."
          );
        }

        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
      } catch (error) {
        console.error("Email verification error:", error);

        setStatus("error");
        setMessage(
          error.message ||
            "Unable to verify your email. Please try again."
        );
      }
    };

    verifyEmail();
  }, []);

  const goToLogin = () => {
    window.history.pushState({}, "", "/");
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.08)",
        }}
      >
        {status === "verifying" && (
          <>
            <h1>Verifying your email...</h1>
            <p>Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              style={{
                fontSize: "56px",
                marginBottom: "16px",
              }}
            >
              ✓
            </div>

            <h1>Email Verified!</h1>

            <p>{message}</p>

            <button
              onClick={goToLogin}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div
              style={{
                fontSize: "56px",
                marginBottom: "16px",
              }}
            >
              ✕
            </div>

            <h1>Verification Failed</h1>

            <p>{message}</p>

            <button
              onClick={goToLogin}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;