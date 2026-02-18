import { buildGithubSignInUrl } from "../auth/url.js";
import { resolveApiBaseUrl } from "../auth/url.js";

function resolveLoginRedirectTarget(): string {
  const query = new URLSearchParams(window.location.search);
  const redirectTo = query.get("redirectTo");

  if (!redirectTo || !redirectTo.startsWith("/")) {
    return "/";
  }

  return redirectTo;
}

export function LoginPage() {
  const redirectTarget = resolveLoginRedirectTarget();
  const callbackUrl = `${window.location.origin}${redirectTarget}`;
  const githubSignInUrl = buildGithubSignInUrl({
    apiBaseUrl: resolveApiBaseUrl(),
    callbackUrl
  });

  return (
    <main className="app-background grid place-items-center px-6 py-10">
      <section className="panel-surface w-full max-w-[460px] px-8 py-10">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-surface-border bg-surface-panelSoft/75 px-4 py-2 shadow-inset">
            <span className="inline-block h-3 w-3 rounded-sm bg-gradient-to-r from-accent-blue to-accent-violet" />
            <span className="text-2xl font-semibold tracking-tight">DevCollab</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Sign In</h1>
          <p className="mt-2 text-sm text-surface-muted">Choose a sign-in provider to continue.</p>
        </div>

        <div className="space-y-3">
          <a
            href={githubSignInUrl}
            className="flex items-center justify-between rounded-xl border border-accent-blue/50 bg-accent-blue/10 px-4 py-3 text-base font-medium text-surface-text shadow-neon transition hover:border-accent-blue hover:bg-accent-blue/20"
          >
            <span>Sign in with GitHub</span>
            <span aria-hidden>→</span>
          </a>

          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-surface-border bg-surface-panelSoft/75 px-4 py-3 text-left text-base text-surface-muted"
          >
            GitLab (coming soon)
          </button>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-surface-border bg-surface-panelSoft/75 px-4 py-3 text-left text-base text-surface-muted"
          >
            Microsoft (coming soon)
          </button>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-surface-border bg-surface-panelSoft/75 px-4 py-3 text-left text-base text-surface-muted"
          >
            Google (coming soon)
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-surface-muted">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </section>
    </main>
  );
}
