import type { FormEvent } from "react";

import type { ChatMessage } from "../../chat/types.js";

function formatTime(iso: string): string {
  const date = new Date(iso);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function TeamChatPanel(props: {
  roomName: string;
  messages: ChatMessage[];
  composerValue: string;
  onComposerChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
  loading: boolean;
}) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await props.onSendMessage();
  }

  return (
    <section className="panel-surface flex h-full min-h-0 flex-col p-3">
      <h2 className="mb-3 text-2xl font-semibold tracking-tight">{props.roomName}</h2>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-surface-border bg-surface-base/70 p-3">
        {props.messages.length === 0 ? (
          <p className="text-sm text-surface-muted">No messages yet. Start the conversation.</p>
        ) : (
          <ul className="space-y-2">
            {props.messages.map((message) => {
              return (
                <li
                  key={message.id}
                  className="rounded-lg border border-surface-border bg-surface-panelSoft/70 px-3 py-2 text-sm"
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-medium text-surface-text">{message.senderName}</span>
                    <span className="text-xs text-surface-muted">{formatTime(message.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-surface-text">{message.content}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-3 flex items-center gap-2">
        <input
          value={props.composerValue}
          onChange={(event) => props.onComposerChange(event.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-surface-border bg-surface-panelSoft/80 px-3 py-2 text-sm text-surface-text outline-none transition focus:border-accent-warning/70"
        />
        <button
          type="submit"
          disabled={props.loading || !props.composerValue.trim()}
          className="rounded-lg border border-accent-warning/70 bg-accent-warning/20 px-3 py-2 text-sm font-medium text-surface-text transition hover:bg-accent-warning/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {props.loading ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
