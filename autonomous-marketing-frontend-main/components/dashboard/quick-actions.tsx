import Link from "next/link";
import {
  CalendarPlus,
  Link2,
  Megaphone,
  Sparkles,
} from "lucide-react";

const actions = [
  {
    title: "Create campaign",
    description: "Let AI build your campaign strategy",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "Connect platform",
    description: "Connect your social media accounts",
    href: "/connections",
    icon: Link2,
  },
  {
    title: "View calendar",
    description: "Review your upcoming content",
    href: "/campaigns",
    icon: CalendarPlus,
  },
];

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        <h2 className="font-semibold">Quick actions</h2>
      </div>

      <div className="mt-4 space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-border hover:bg-muted/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border">
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
