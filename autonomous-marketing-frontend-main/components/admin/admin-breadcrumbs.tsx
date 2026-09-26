"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function AdminBreadcrumbs() {
  const pathname = usePathname();

  // Convert route path /admin/users/123 to breadcrumbs
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Home size={14} />
        <span>Admin Dashboard</span>
      </div>
    );
  }

  const breadcrumbs = segments.map((segment, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

    return { label, href, isLast: idx === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500">
      <Link href="/admin/dashboard" className="hover:text-neutral-900 transition flex items-center gap-1">
        <Home size={13} />
        <span>Admin</span>
      </Link>

      {breadcrumbs.map((b, idx) => {
        if (idx === 0) return null; // skip root 'admin'

        return (
          <div key={b.href} className="flex items-center gap-1.5">
            <ChevronRight size={13} className="text-neutral-400" />
            {b.isLast ? (
              <span className="font-semibold text-neutral-900 capitalize">{b.label}</span>
            ) : (
              <Link href={b.href} className="hover:text-neutral-900 transition capitalize">
                {b.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
