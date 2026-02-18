import { useState } from "react";

import type { PullRequestItem } from "./mock-data.js";

function prStatusClasses(status: PullRequestItem["status"]): string {
  if (status === "APPROVED" || status === "MERGED") {
    return "status-chip border-accent-success/50 bg-accent-success/20 text-accent-success";
  }

  if (status === "CHANGES REQUESTED") {
    return "status-chip border-accent-danger/50 bg-accent-danger/20 text-accent-danger";
  }

  return "status-chip border-accent-warning/50 bg-accent-warning/20 text-accent-warning";
}

export function PullRequestCard(props: { item: PullRequestItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-xl border border-surface-border bg-surface-panelSoft/75 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-medium sm:text-lg">{props.item.title}</p>
          <p className="text-sm text-surface-muted">
            {props.item.author} · {props.item.ago}
          </p>
        </div>
        <span className={prStatusClasses(props.item.status)}>{props.item.status}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="truncate pr-3 text-xs text-surface-muted">{props.item.branch}</p>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="rounded-md border border-surface-border px-2 py-1 text-xs text-surface-muted transition hover:border-accent-blue/60 hover:text-surface-text"
        >
          {expanded ? "Hide" : "Details"}
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 rounded-lg border border-surface-border bg-surface-base/70 p-3 text-sm text-surface-muted">
          <p>Review comments: {props.item.comments}</p>
          <p>Last update: {props.item.ago}</p>
        </div>
      ) : null}
    </article>
  );
}
