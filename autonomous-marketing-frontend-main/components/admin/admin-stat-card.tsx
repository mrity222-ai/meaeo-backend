import { AdminStatCardProps } from "@/types/admin";

export function AdminStatCard({
  title,
  value,
  change,
  changeType = "increase",
  description,
  icon: Icon,
}: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-500">{title}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        {value}
      </p>

      {(change || description) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          {change && (
            <span
              className={`font-semibold ${
                changeType === "increase"
                  ? "text-emerald-600"
                  : changeType === "decrease"
                  ? "text-red-600"
                  : "text-neutral-600"
              }`}
            >
              {change}
            </span>
          )}
          {description && <span className="text-neutral-500">{description}</span>}
        </div>
      )}
    </div>
  );
}
