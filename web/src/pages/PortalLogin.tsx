import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { extractApiError, portalApi } from "../lib/api";
import { usePortalAuth } from "../lib/auth";
import { Logo } from "../components/Chrome";

export default function PortalLogin() {
  const navigate = useNavigate();
  const { access, hydrated, setTokens, clear } = usePortalAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && access) navigate("/portal", { replace: true });
  }, [hydrated, access, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const session = await portalApi.login(email.trim(), password);
      // Confirm this account really is a therapist before persisting the session,
      // so a client account never briefly lands on the portal.
      await portalApi.meWithToken(session.access);
      setTokens(session.access, session.refresh);
      navigate("/portal", { replace: true });
    } catch (err) {
      clear();
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setError(
          "This account is not registered as a therapist. Contact MindEase to apply as a clinician."
        );
      } else {
        setError(extractApiError(err, "Sign-in failed. Please check your credentials."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-50 px-5 py-16">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-8" data-testid="portal-login-card">
          <h1 className="text-2xl font-bold text-ink-900">Therapist portal</h1>
          <p className="mt-1 text-sm text-ink-400">
            Sign in to manage your sessions, availability and Zoom links.
          </p>

          {error ? (
            <div
              role="alert"
              data-testid="portal-error"
              className="mt-5 rounded-xl2 border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600"
            >
              {error}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-600" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                data-testid="portal-email"
                className="field"
                type="email"
                autoComplete="email"
                placeholder="you@mindease.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-600" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                data-testid="portal-password"
                className="field"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              data-testid="portal-submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

  
        </div>

        <p className="mt-6 text-center text-sm text-ink-400">
          Not a therapist?{" "}
          <Link to="/" className="font-medium text-primary-600 hover:underline">
            Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}