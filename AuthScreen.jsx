import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(""); setMessage(""); };

  const switchMode = (m) => { setMode(m); clearMessages(); };

  const friendlyError = (code) => {
    const map = {
      "auth/email-already-in-use": "That email is already registered.",
      "auth/invalid-email": "Invalid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/user-not-found": "No account with that email.",
      "auth/wrong-password": "Wrong password.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/operation-not-allowed": "Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method and enable Email/Password.",
      "auth/configuration-not-found": "Firebase Auth is not configured. Check your firebase.js config values.",
      "auth/internal-error": "Firebase internal error. Check your project setup.",
      "auth/unauthorized-domain": "This domain is not authorised in Firebase. Add it under Authentication → Settings → Authorised domains.",
    };
    return map[code] || `Error: ${code || "unknown"}. Check the browser console for details.`;
  };

  const handleEmailAuth = async () => {
    clearMessages();
    if (!email.trim()) { setError("Enter your email."); return; }
    if (mode !== "reset" && !password) { setError("Enter your password."); return; }
    if (mode === "signup" && !displayName.trim()) { setError("Enter your name."); return; }

    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } else if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage("Reset email sent. Check your inbox.");
      }
    } catch (e) {
      console.error("Auth error:", e.code, e.message);
      setError(friendlyError(e.code));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    clearMessages();
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Google auth error:", e.code, e.message);
      setError(friendlyError(e.code));
    }
    setLoading(false);
  };

  const onKey = (e) => { if (e.key === "Enter") handleEmailAuth(); };

  return (
    <div style={s.container}>
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={s.card}>
        <div style={s.logo}>BTS</div>
        <div style={s.appName}>BECOMING TOMMY SHELBY</div>
        <div style={s.tagline}>Control yourself. Control your destiny.</div>

        {mode !== "reset" && (
          <div style={s.modeToggle}>
            <button
              style={mode === "login" ? { ...s.modeBtn, ...s.modeBtnActive } : s.modeBtn}
              onClick={() => switchMode("login")}
            >
              LOG IN
            </button>
            <button
              style={mode === "signup" ? { ...s.modeBtn, ...s.modeBtnActive } : s.modeBtn}
              onClick={() => switchMode("signup")}
            >
              SIGN UP
            </button>
          </div>
        )}

        {mode === "reset" && (
          <div style={s.resetHeader}>RESET PASSWORD</div>
        )}

        {mode === "signup" && (
          <input
            style={s.input}
            placeholder="YOUR NAME"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onKeyDown={onKey}
            autoComplete="name"
          />
        )}

        <input
          style={s.input}
          type="email"
          placeholder="EMAIL"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={onKey}
          autoComplete="email"
        />

        {mode !== "reset" && (
          <input
            style={s.input}
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={onKey}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        )}

        {error && <div style={s.error}>{error}</div>}
        {message && <div style={s.successMsg}>{message}</div>}

        <button style={{ ...s.primaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleEmailAuth} disabled={loading}>
          {loading
            ? "..."
            : mode === "login"
            ? "LOG IN"
            : mode === "signup"
            ? "CREATE ACCOUNT"
            : "SEND RESET EMAIL"}
        </button>

        {mode !== "reset" && (
          <>
            <div style={s.dividerRow}>
              <div style={s.dividerLine} />
              <span style={s.dividerText}>OR</span>
              <div style={s.dividerLine} />
            </div>
            <button style={{ ...s.googleBtn, opacity: loading ? 0.6 : 1 }} onClick={handleGoogle} disabled={loading}>
              <span style={s.googleIcon}>G</span>
              CONTINUE WITH GOOGLE
            </button>
          </>
        )}

        <div style={s.links}>
          {mode === "login" && (
            <button style={s.linkBtn} onClick={() => switchMode("reset")}>
              Forgot password?
            </button>
          )}
          {mode === "reset" && (
            <button style={s.linkBtn} onClick={() => switchMode("login")}>
              Back to log in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  container: {
    minHeight: "100vh",
    background: "#0A0A0A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#111",
    border: "1px solid #1E1E1E",
    borderRadius: "8px",
    padding: "40px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "56px",
    color: "#D4A03C",
    letterSpacing: "6px",
    textAlign: "center",
    lineHeight: 1,
  },
  appName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "12px",
    letterSpacing: "4px",
    color: "#555",
    textAlign: "center",
  },
  tagline: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#3A3A3A",
    textAlign: "center",
    marginBottom: "8px",
  },
  modeToggle: {
    display: "flex",
    gap: "8px",
  },
  modeBtn: {
    flex: 1,
    padding: "10px",
    background: "transparent",
    border: "1px solid #2A2A2A",
    color: "#555",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "2px",
    cursor: "pointer",
    borderRadius: "4px",
  },
  modeBtnActive: {
    borderColor: "#D4A03C",
    color: "#D4A03C",
    background: "rgba(212,160,60,0.06)",
  },
  resetHeader: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "20px",
    letterSpacing: "4px",
    color: "#D4A03C",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#0A0A0A",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    color: "#E8E4DD",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    outline: "none",
  },
  error: {
    color: "#C23B22",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    textAlign: "center",
    padding: "8px 12px",
    background: "rgba(194,59,34,0.08)",
    borderRadius: "4px",
    border: "1px solid rgba(194,59,34,0.25)",
  },
  successMsg: {
    color: "#3A8F6A",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    textAlign: "center",
    padding: "8px 12px",
    background: "rgba(58,143,106,0.08)",
    borderRadius: "4px",
    border: "1px solid rgba(58,143,106,0.25)",
  },
  primaryBtn: {
    padding: "14px",
    background: "#D4A03C",
    border: "none",
    borderRadius: "4px",
    color: "#0A0A0A",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "16px",
    letterSpacing: "3px",
    cursor: "pointer",
    marginTop: "4px",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#1E1E1E",
  },
  dividerText: {
    color: "#333",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "12px",
    background: "transparent",
    border: "1px solid #2A2A2A",
    borderRadius: "4px",
    color: "#E8E4DD",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "14px",
    letterSpacing: "2px",
    cursor: "pointer",
  },
  googleIcon: {
    fontFamily: "sans-serif",
    fontWeight: "bold",
    fontSize: "16px",
    color: "#D4A03C",
  },
  links: {
    textAlign: "center",
    marginTop: "4px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#444",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
