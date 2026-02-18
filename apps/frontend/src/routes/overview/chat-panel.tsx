export function ChatPanel(props: { messages: string[] }) {
  return (
    <article className="dashboard-card flex min-h-0 flex-col">
      <h2 className="mb-3 text-xl font-semibold sm:text-2xl">Team Chat</h2>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
        {props.messages.map((message) => (
          <li key={message} className="rounded-lg border border-surface-border bg-surface-panelSoft/70 px-3 py-2">
            {message}
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-lg border border-surface-border bg-surface-base/70 px-3 py-2 text-sm text-surface-muted">
        Type a message...
      </div>
    </article>
  );
}
