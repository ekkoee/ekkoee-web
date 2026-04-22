"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/portal";

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function onPasswordLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setStatus(`> AUTH_FAIL: ${error.message}`);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  async function onMagicLink(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    setLoading(false);
    if (error) {
      setStatus(`> AUTH_FAIL: ${error.message}`);
      return;
    }
    setStatus("> CHECK_INBOX: 登入連結已發送");
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="sec-label" style={{ marginBottom: "24px" }}>
          [AUTH] SECURE_HANDSHAKE
        </div>
        <h1 className="login-title">ekkoee // terminal</h1>
        <p className="login-sub">authenticate to access your factory agent.</p>

        <div className="login-tabs">
          <button
            className={`login-tab${mode === "password" ? " active" : ""}`}
            onClick={() => setMode("password")}
            type="button"
          >
            PASSWORD
          </button>
          <button
            className={`login-tab${mode === "magic" ? " active" : ""}`}
            onClick={() => setMode("magic")}
            type="button"
          >
            MAGIC LINK
          </button>
        </div>

        <form onSubmit={mode === "password" ? onPasswordLogin : onMagicLink}>
          <label className="login-label">EMAIL</label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@factory.com"
            required
            autoComplete="email"
          />

          {mode === "password" && (
            <>
              <label className="login-label">PASSWORD</label>
              <input
                className="login-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </>
          )}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading
              ? "> ..."
              : mode === "password"
                ? "▶ AUTHENTICATE"
                : "▶ SEND MAGIC LINK"}
          </button>
        </form>

        {status && <div className="login-status">{status}</div>}

        <div className="login-footer">
          <a href="/">← back to ekkoee.com</a>
        </div>
      </div>

      <style jsx>{`
        .login-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          z-index: 2;
        }
        .login-card {
          width: 100%;
          max-width: 440px;
          background: var(--bg-2);
          border: 1px solid var(--fg-5);
          padding: 40px 36px;
          font-family: var(--font-mono);
        }
        .login-title {
          font-family: var(--font-brand);
          font-weight: 700;
          font-size: 32px;
          color: var(--fg);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .login-sub {
          font-size: 12px;
          color: var(--fg-3);
          margin-bottom: 28px;
          letter-spacing: 0.05em;
        }
        .login-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--fg-5);
        }
        .login-tab {
          flex: 1;
          padding: 10px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--fg-3);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-tab:hover {
          color: var(--fg);
        }
        .login-tab.active {
          color: var(--green);
          border-bottom-color: var(--green);
        }
        .login-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.25em;
          color: var(--fg-3);
          margin: 16px 0 8px;
          text-transform: uppercase;
        }
        .login-input {
          width: 100%;
          background: var(--bg-3);
          border: 1px solid var(--fg-5);
          color: var(--fg);
          font-family: var(--font-mono);
          font-size: 14px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .login-input:focus {
          border-color: var(--green-3);
        }
        .login-btn {
          width: 100%;
          margin-top: 28px;
          padding: 14px;
          background: var(--green);
          color: var(--bg);
          border: none;
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.25em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-btn:hover:not(:disabled) {
          box-shadow: 0 0 30px var(--green-3);
          transform: translateY(-1px);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-status {
          margin-top: 20px;
          padding: 12px 14px;
          background: var(--bg-3);
          border-left: 3px solid var(--amber);
          color: var(--fg-2);
          font-size: 12px;
          font-family: var(--font-mono);
        }
        .login-footer {
          margin-top: 32px;
          font-size: 11px;
          letter-spacing: 0.15em;
        }
        .login-footer a {
          color: var(--fg-3);
          text-decoration: none;
        }
        .login-footer a:hover {
          color: var(--amber);
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
