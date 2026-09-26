"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Filter,
  Image,
  MoreHorizontal,
  Search,
  Sparkles,
  Video,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type ContentStatus =
  | "Published"
  | "Scheduled"
  | "Pending Review"
  | "Rejected"
  | "Failed";

type ContentType = "Post" | "Image" | "Video" | "Carousel";

type ContentItem = {
  id: string;
  title: string;
  campaign: string;
  campaignId: string;
  business: string;
  platform: string;
  type: ContentType;
  status: ContentStatus;
  scheduled: string;
  created: string;
  generatedByAI: boolean;
};

const contentItems: ContentItem[] = [
  {
    id: "POST-5001",
    title: "5 Ways to Grow Your Business This Summer",
    campaign: "Summer Growth Campaign",
    campaignId: "CAM-2001",
    business: "Growth Labs",
    platform: "Instagram",
    type: "Carousel",
    status: "Published",
    scheduled: "Sep 08, 2026 · 10:00 AM",
    created: "Sep 07, 2026",
    generatedByAI: true,
  },
  {
    id: "POST-5002",
    title: "Your Summer Marketing Checklist",
    campaign: "Summer Growth Campaign",
    campaignId: "CAM-2001",
    business: "Growth Labs",
    platform: "Facebook",
    type: "Image",
    status: "Published",
    scheduled: "Sep 07, 2026 · 02:00 PM",
    created: "Sep 06, 2026",
    generatedByAI: true,
  },
  {
    id: "POST-5003",
    title: "Growth Strategy for Q4",
    campaign: "Summer Growth Campaign",
    campaignId: "CAM-2001",
    business: "Growth Labs",
    platform: "LinkedIn",
    type: "Post",
    status: "Scheduled",
    scheduled: "Sep 10, 2026 · 11:00 AM",
    created: "Sep 08, 2026",
    generatedByAI: true,
  },
  {
    id: "POST-5004",
    title: "What Makes a High-Converting Campaign?",
    campaign: "Summer Growth Campaign",
    campaignId: "CAM-2001",
    business: "Growth Labs",
    platform: "Instagram",
    type: "Video",
    status: "Pending Review",
    scheduled: "Sep 11, 2026 · 04:00 PM",
    created: "Sep 09, 2026",
    generatedByAI: true,
  },
  {
    id: "POST-5005",
    title: "New Collection Has Arrived",
    campaign: "New Collection Launch",
    campaignId: "CAM-2002",
    business: "Nova Fashion",
    platform: "Instagram",
    type: "Image",
    status: "Pending Review",
    scheduled: "Sep 12, 2026 · 10:00 AM",
    created: "Sep 09, 2026",
    generatedByAI: true,
  },
  {
    id: "POST-5006",
    title: "Weekend Special Offer",
    campaign: "Weekend Food Promotion",
    campaignId: "CAM-2003",
    business: "Urban Eats",
    platform: "Facebook",
    type: "Image",
    status: "Published",
    scheduled: "Sep 06, 2026 · 01:00 PM",
    created: "Sep 05, 2026",
    generatedByAI: false,
  },
  {
    id: "POST-5007",
    title: "Healthy Habits Start Today",
    campaign: "Wellness Awareness",
    campaignId: "CAM-2004",
    business: "Wellness Co.",
    platform: "Instagram",
    type: "Video",
    status: "Rejected",
    scheduled: "Sep 09, 2026 · 06:00 PM",
    created: "Sep 08, 2026",
    generatedByAI: true,
  },
  {
    id: "POST-5008",
    title: "Build Better Habits",
    campaign: "Wellness Awareness",
    campaignId: "CAM-2004",
    business: "Wellness Co.",
    platform: "LinkedIn",
    type: "Post",
    status: "Failed",
    scheduled: "Sep 08, 2026 · 09:00 AM",
    created: "Sep 07, 2026",
    generatedByAI: true,
  },
];

const statusStyles: Record<ContentStatus, string> = {
  Published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Pending Review":
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  Failed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function AdminContentPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ContentStatus>("All");
  const [type, setType] = useState<"All" | ContentType>("All");

  const filteredContent = useMemo(() => {
    const query = search.trim().toLowerCase();

    return contentItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.business.toLowerCase().includes(query) ||
        item.campaign.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.platform.toLowerCase().includes(query);

      const matchesStatus =
        status === "All" || item.status === status;

      const matchesType = type === "All" || item.type === type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, status, type]);

  const published = contentItems.filter(
    (item) => item.status === "Published",
  ).length;

  const scheduled = contentItems.filter(
    (item) => item.status === "Scheduled",
  ).length;

  const review = contentItems.filter(
    (item) => item.status === "Pending Review",
  ).length;

  const failed = contentItems.filter(
    (item) => item.status === "Failed" || item.status === "Rejected",
  ).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/admin/dashboard"
            className="hover:text-foreground"
          >
            Admin
          </Link>

          <span>/</span>

          <span>Content</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Content Management
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor generated content, review status, publishing and
              failures.
            </p>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

        <div>
          <p className="text-sm font-medium">Demo content data</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Content records and actions are currently frontend-only. Real
            content data will be connected during API integration.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Published"
          value={published}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />

        <Stat
          label="Scheduled"
          value={scheduled}
          icon={<Clock3 className="h-4 w-4" />}
        />

        <Stat
          label="Pending Review"
          value={review}
          icon={<FileText className="h-4 w-4" />}
        />

        <Stat
          label="Failed / Rejected"
          value={failed}
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      {/* Main */}
      <section className="overflow-hidden rounded-xl border border-border bg-background">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search content, business, campaign..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as "All" | ContentStatus,
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none focus:border-foreground sm:w-44"
              >
                <option value="All">All Status</option>
                <option value="Published">Published</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Pending Review">
                  Pending Review
                </option>
                <option value="Rejected">Rejected</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as "All" | ContentType)
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground sm:w-36"
            >
              <option value="All">All Types</option>
              <option value="Post">Post</option>
              <option value="Image">Image</option>
              <option value="Video">Video</option>
              <option value="Carousel">Carousel</option>
            </select>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1150px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Content</th>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Platform</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Scheduled</th>
                <th className="px-5 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredContent.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <ContentIcon type={item.type} />

                      <div className="min-w-0">
                        <p className="max-w-xs truncate text-sm font-medium">
                          {item.title}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          {item.id}

                          {item.generatedByAI && (
                            <>
                              <span>·</span>
                              <Sparkles className="h-3 w-3" />
                              AI
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {item.business}
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/campaigns/${item.campaignId}`}
                      className="text-sm hover:underline"
                    >
                      {item.campaign}
                    </Link>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {item.platform}
                  </td>

                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {item.type}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {item.scheduled}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                      aria-label={`View ${item.title}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-border lg:hidden">
          {filteredContent.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <ContentIcon type={item.type} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.id}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
                      aria-label="Content actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>

                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {item.type}
                    </span>

                    {item.generatedByAI && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-600 dark:text-violet-400">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">
                        Business:
                      </span>{" "}
                      {item.business}
                    </p>

                    <p>
                      <span className="font-medium text-foreground">
                        Campaign:
                      </span>{" "}
                      {item.campaign}
                    </p>

                    <p>
                      <span className="font-medium text-foreground">
                        Platform:
                      </span>{" "}
                      {item.platform}
                    </p>

                    <p>
                      <span className="font-medium text-foreground">
                        Scheduled:
                      </span>{" "}
                      {item.scheduled}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
                  >
                    <Eye className="h-4 w-4" />
                    View Content
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="px-6 py-16 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

            <h3 className="mt-3 text-sm font-medium">
              No content found
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filteredContent.length} of {contentItems.length} content
            items
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-foreground px-2 text-xs text-background">
              1
            </span>

            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>

        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function ContentIcon({ type }: { type: ContentType }) {
  const Icon =
    type === "Video"
      ? Video
      : type === "Image" || type === "Carousel"
        ? Image
        : FileText;

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
