"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  /** Bump this value to re-trigger the toast with the same message. */
  toastKey?: number;
  onDismiss: () => void;
  duration?: number;
}

/**
 * Centred bottom-of-screen toast for success messages. Auto-dismisses after
 * `duration` ms; clicking dismisses immediately.
 */
export default function Toast({
  message,
  toastKey,
  onDismiss,
  duration = 1800,
}: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [message, toastKey, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8">
      <button
        type="button"
        onClick={onDismiss}
        className="pointer-events-auto rounded-full border border-[var(--border-2)] bg-card/95 px-5 py-2 text-sm text-fg shadow-[0_0_24px_var(--green-glow)] backdrop-blur"
      >
        {message}
      </button>
    </div>
  );
}
