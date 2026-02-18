import { ActivityFeed } from "./activity-feed.js";
import { ChatPanel } from "./chat-panel.js";
import { CiStatusCard } from "./ci-status-card.js";
import { chatMessagesMock, ciStatusesMock, activityMock, pullRequestsMock, snippetMock } from "./mock-data.js";
import { PullRequestCard } from "./pr-card.js";

export function OverviewDashboard() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_minmax(0,0.9fr)]">
      <section className="space-y-4 pr-1">
        <article className="dashboard-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold sm:text-2xl">Pull Requests</h2>
            <span className="text-sm text-surface-muted">Priority view</span>
          </div>

          <div className="space-y-3">
            {pullRequestsMock.map((item) => (
              <PullRequestCard key={item.id} item={item} />
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <h2 className="mb-3 text-xl font-semibold sm:text-2xl">Code Snippet</h2>
          <pre className="max-h-44 overflow-auto rounded-xl border border-surface-border bg-surface-base/85 p-4 text-sm text-slate-200">
            {snippetMock}
          </pre>
        </article>
      </section>

      <section className="space-y-4 pr-1">
        <article className="dashboard-card">
          <h2 className="mb-3 text-xl font-semibold sm:text-2xl">CI / CD Status</h2>
          <div className="space-y-2">
            {ciStatusesMock.map((item) => (
              <CiStatusCard key={item.id} item={item} />
            ))}
          </div>
        </article>

        <div className="grid gap-4 2xl:grid-cols-1">
          <ActivityFeed items={activityMock} />
          <ChatPanel messages={chatMessagesMock} />
        </div>
      </section>
    </div>
  );
}
