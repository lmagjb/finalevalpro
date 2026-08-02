"use client";

import { signOut } from "next-auth/react";

export default function DashboardNav({
  title,
  userName,
}: {
  title: string;
  userName?: string | null;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-teal">
          EVALPRO
        </p>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {userName && <span className="text-sm text-slate">{userName}</span>}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-paper"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
