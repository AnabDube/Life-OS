"use client";

import { useActionState } from "react";
import { sendMagicLink, type MagicLinkState } from "./actions";

const INITIAL_STATE: MagicLinkState = { ok: false, error: null, email: null };

interface LoginFormProps {
  /** Optional `?next=` param forwarded from /login so we land back where the user came from. */
  next?: string;
}

export default function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    sendMagicLink,
    INITIAL_STATE,
  );

  if (state.ok) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border-1)] bg-card p-5 text-center">
        <p className="font-[family-name:var(--font-display)] text-base text-green">
          Check your inbox
        </p>
        <p className="mt-2 text-sm text-fg-mid">
          A sign-in link is on its way to{" "}
          <span className="text-fg">{state.email}</span>. It expires in an hour
          — you can close this tab.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="block">
        <span className="sr-only">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          spellCheck={false}
          inputMode="email"
          placeholder="you@email.com"
          defaultValue={state.email ?? ""}
          aria-invalid={state.error ? true : undefined}
          className="block w-full min-h-[44px] rounded-[var(--radius-card)] border border-[var(--border-1)] bg-bg-2 px-4 py-3 text-fg placeholder:text-fg-dim outline-none transition-colors focus:border-[var(--border-2)]"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="block w-full min-h-[44px] rounded-[var(--radius-card)] bg-green px-4 py-3 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send me a link"}
      </button>
      {state.error ? (
        <p
          role="alert"
          className="text-center text-xs text-danger-text"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
