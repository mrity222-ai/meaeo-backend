import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center text-neutral-950",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
        <Icon className="h-5 w-5 text-neutral-500" />
      </div>

      <h3 className="mt-4 text-base font-semibold">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
