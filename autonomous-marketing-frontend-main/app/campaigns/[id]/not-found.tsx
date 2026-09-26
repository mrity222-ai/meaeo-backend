import Link from "next/link";
import { ArrowLeft, FolderSearch } from "lucide-react";

export default function CampaignNotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-white px-4 text-neutral-950 md:pl-[230px]">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
          <FolderSearch className="h-5 w-5 text-neutral-950" />
        </div>

        <h1 className="mt-5 text-xl font-semibold">
          Campaign not found
        </h1>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          This campaign may have been deleted, moved, or you may not have
          access to it.
        </p>

        <Link
          href="/campaigns"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to campaigns
        </Link>
      </div>
    </main>
  );
}
