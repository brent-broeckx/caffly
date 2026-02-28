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
  currentUserId: string | null;
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
    <section className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-0 pb-4">
            {props.messages.length === 0 ? (
              <p className="text-sm text-[var(--accent)]">No messages yet. Start the conversation.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {props.messages.map((message) => {
                  const isMine = props.currentUserId && message.senderId === props.currentUserId;

                  return (
                    <li key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-lg text-[var(--accent)] ${
                        isMine ? "bg-[rgba(255,167,127,0.14)]" : "bg-[rgba(255,167,127,0.04)]"
                      }`}>
                        {!isMine ? (
                          <div className="mb-1 text-xs font-medium text-[var(--accent)]">{message.senderName}</div>
                        ) : null}
                        <div className="whitespace-pre-wrap break-words text-sm">{message.content}</div>
                        <div className="mt-1 text-right text-[10px] text-[var(--accent)] opacity-70">{formatTime(message.createdAt)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="flex items-center gap-2 px-0 py-2 border-t border-[rgba(255,167,127,0.06)] bg-[rgba(0,0,0,0.04)]">
        <input
          value={props.composerValue}
          onChange={(event) => props.onComposerChange(event.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg px-3 py-2 text-sm text-[var(--accent)] bg-[rgba(255,255,255,0.02)] outline-none"
        />
        <button
          type="submit"
          disabled={props.loading || !props.composerValue.trim()}
          className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--app-bg)] bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {props.loading ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
