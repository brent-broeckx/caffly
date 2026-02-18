import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { fetchAuthSession } from "./auth/session.js";
import { resolveApiBaseUrl } from "./auth/url.js";
import { AppRouterProvider } from "./router.js";
import "./styles.css";

type AuthState = "checking" | "ready";

function App() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [session, setSession] = useState<Awaited<ReturnType<typeof fetchAuthSession>>>(null);
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);

  useEffect(() => {
    let mounted = true;

    void fetchAuthSession(apiBaseUrl)
      .then((resolvedSession) => {
        if (!mounted) {
          return;
        }

        setSession(resolvedSession);
        setAuthState("ready");
      })
      .catch(() => {
        if (mounted) {
          setSession(null);
          setAuthState("ready");
        }
      });

    return () => {
      mounted = false;
    };
  }, [apiBaseUrl]);

  if (authState === "checking") {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-surface-muted">
        <p>Checking authentication...</p>
      </main>
    );
  }

  return <AppRouterProvider session={session} />;
}

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
