import type { CiStatusItem } from "./mock-data.js";

function statusClasses(state: CiStatusItem["state"]): string {
  if (state === "Passed") {
    return "status-chip border-accent-success/50 bg-accent-success/20 text-accent-success";
  }

  if (state === "Failed") {
    return "status-chip border-accent-danger/50 bg-accent-danger/20 text-accent-danger";
  }

  return "status-chip border-accent-warning/50 bg-accent-warning/20 text-accent-warning";
}

export function CiStatusCard(props: { item: CiStatusItem }) {
  return (
    <article className="rounded-lg border border-surface-border bg-surface-panelSoft/70 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium sm:text-base">{props.item.name}</p>
        <span className={statusClasses(props.item.state)}>{props.item.state}</span>
      </div>
      <p className="mt-1 text-xs text-surface-muted">
        {props.item.branch} · {props.item.duration}
      </p>
    </article>
  );
}
