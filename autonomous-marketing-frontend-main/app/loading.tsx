import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-white px-4 text-neutral-950">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-950" />
        </div>

        <h2 className="mt-4 text-base font-semibold">
          Loading your workspace
        </h2>

        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Please wait while we load your marketing workspace.
        </p>
      </div>
    </main>
  );
}
