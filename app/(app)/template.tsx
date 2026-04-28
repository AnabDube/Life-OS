"use client";

import type { ReactNode } from "react";

/**
 * Templates re-mount on every navigation, which makes them the natural place
 * to hang a fade-in animation between tabs. The keyframe lives in globals.css.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
