export default function CatalogueLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-36 animate-pulse rounded-md bg-muted sm:h-9" />

            <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
          </div>

          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Upload area */}
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />

            <div className="mt-4 h-5 w-48 animate-pulse rounded-md bg-muted" />

            <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />

            <div className="mt-1 h-3 w-56 max-w-full animate-pulse rounded-md bg-muted" />

            <div className="mt-5 h-9 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>

        {/* Section heading */}
        <div className="mt-8 space-y-2">
          <div className="h-6 w-28 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({
            length: 10,
          }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="aspect-square animate-pulse bg-muted" />

              <div className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded-md bg-muted" />
                </div>

                <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}