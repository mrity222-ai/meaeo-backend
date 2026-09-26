import { Bell, Plus } from "lucide-react";
import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <div>
        <p className="text-sm text-muted-foreground">Tuesday, September 9</p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Good morning 👋
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what maeaco is working on.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
        </button>

        <Link
          href="/campaigns"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New campaign
        </Link>
      </div>
    </header>
  );
}
