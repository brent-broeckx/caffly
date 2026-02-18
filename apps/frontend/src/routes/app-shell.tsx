import { useState } from "react";

import { OverviewDashboard } from "./overview/overview-dashboard.js";

type NavSection = "Overview" | "Pull Requests" | "CI / CD" | "Snippets" | "Team Chat";

const navItems: NavSection[] = ["Overview", "Pull Requests", "CI / CD", "Snippets", "Team Chat"];

export function AppShellPage() {
  const [activeSection, setActiveSection] = useState<NavSection>("Overview");

  return (
    <div className="app-background h-screen w-screen overflow-hidden text-surface-text">
      <div className="grid h-full w-full grid-cols-[220px_minmax(0,1fr)] overflow-hidden">
        <aside className="border-r border-surface-border bg-surface-panelSoft/90 p-4">
          <div className="h-full overflow-y-auto">
            <div className="mb-7 flex items-center gap-3 px-2">
              <span className="inline-block h-3 w-3 rounded-sm bg-gradient-to-r from-accent-blue to-accent-violet" />
              <span className="text-3xl font-semibold tracking-tight">Codex</span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveSection(item)}
                  className={`nav-item w-full text-left ${activeSection === item ? "nav-item-active" : ""}`}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="mt-8 border-t border-surface-border pt-5">
              <p className="mb-2 px-3 text-xs uppercase tracking-[0.2em] text-surface-muted">Projects</p>
              <div className="space-y-1">
                <p className="nav-item nav-item-active">Frontend-App</p>
                <p className="nav-item">Alpha-API</p>
                <p className="nav-item">Deploy-X</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex h-full min-w-0 flex-col bg-surface-canvas/80">
          <div className="panel-surface m-3 flex h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-xl">
            <header className="flex items-center justify-between border-b border-surface-border px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-surface-muted">Dashboard</p>
                <h1 className="text-2xl font-semibold tracking-tight">{activeSection}</h1>
              </div>
              <div className="rounded-full border border-surface-border bg-surface-panelSoft/80 px-4 py-2 text-sm text-surface-muted">
                Logged in
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
              {activeSection === "Overview" ? (
                <OverviewDashboard />
              ) : (
                <section className="dashboard-card">
                  <h2 className="text-xl font-semibold sm:text-2xl">{activeSection}</h2>
                  <p className="mt-3 text-sm text-surface-muted">
                    This section is scaffolded in the shell and will be implemented in upcoming roadmap tasks.
                  </p>
                </section>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
