import type { ActivityItem } from "./mock-data.js";

export function ActivityFeed(props: { items: ActivityItem[] }) {
  return (
    <article className="dashboard-card flex min-h-0 flex-col">
      <h2 className="mb-3 text-xl font-semibold sm:text-2xl">Team Activity</h2>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
        {props.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface-panelSoft/70 px-3 py-2"
          >
            <span className="line-clamp-2 text-slate-100">{item.text}</span>
            <span className="shrink-0 text-surface-muted">{item.ago}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
