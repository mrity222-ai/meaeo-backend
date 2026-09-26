export default function CampaignDetailLoading() {
  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8 text-neutral-950 md:pl-[230px]">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-8 w-56 rounded-lg bg-neutral-200" />
        <div className="h-4 w-80 rounded bg-neutral-200" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-neutral-200 bg-neutral-50"
            />
          ))}
        </div>

        <div className="h-72 rounded-2xl border border-neutral-200 bg-neutral-50" />

        <div className="h-56 rounded-2xl border border-neutral-200 bg-neutral-50" />
      </div>
    </main>
  );
}
