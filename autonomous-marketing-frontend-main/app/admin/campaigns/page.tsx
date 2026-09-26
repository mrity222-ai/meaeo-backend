"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type CampaignStatus =
  | "Active"
  | "Scheduled"
  | "Completed"
  | "Paused"
  | "Failed";

type Campaign = {
  id: string;
  name: string;
  business: string;
  businessId: string;
  objective: string;
  status: CampaignStatus;
  platforms: string[];
  posts: number;
  published: number;
  reach: string;
  engagement: string;
  startDate: string;
  endDate: string;
};

const campaigns: Campaign[] = [
  {
    id: "CAM-2001",
    name: "Summer Growth Campaign",
    business: "Growth Labs",
    businessId: "BUS-1001",
    objective: "Brand Awareness",
    status: "Active",
    platforms: ["Instagram", "Facebook", "LinkedIn"],
    posts: 18,
    published: 11,
    reach: "84.2K",
    engagement: "7.8%",
    startDate: "Sep 02, 2026",
    endDate: "Sep 30, 2026",
  },
  {
    id: "CAM-2002",
    name: "New Collection Launch",
    business: "Nova Fashion",
    businessId: "BUS-1002",
    objective: "Product Launch",
    status: "Scheduled",
    platforms: ["Instagram", "Facebook"],
    posts: 12,
    published: 0,
    reach: "—",
    engagement: "—",
    startDate: "Sep 12, 2026",
    endDate: "Oct 05, 2026",
  },
  {
    id: "CAM-2003",
    name: "Weekend Food Promotion",
    business: "Urban Eats",
    businessId: "BUS-1003",
    objective: "Conversions",
    status: "Active",
    platforms: ["Instagram", "Facebook"],
    posts: 10,
    published: 6,
    reach: "31.6K",
    engagement: "9.2%",
    startDate: "Sep 05, 2026",
    endDate: "Sep 20, 2026",
  },
  {
    id: "CAM-2004",
    name: "Wellness Awareness",
    business: "Wellness Co.",
    businessId: "BUS-1005",
    objective: "Lead Generation",
    status: "Active",
    platforms: ["Instagram", "LinkedIn", "X"],
    posts: 24,
    published: 16,
    reach: "126.8K",
    engagement: "8.6%",
    startDate: "Aug 25, 2026",
    endDate: "Sep 25, 2026",
  },
  {
    id: "CAM-2005",
    name: "Brand Introduction",
    business: "Pixel Studio",
    businessId: "BUS-1004",
    objective: "Brand Awareness",
    status: "Completed",
    platforms: ["Instagram", "LinkedIn"],
    posts: 8,
    published: 8,
    reach: "19.4K",
    engagement: "6.1%",
    startDate: "Aug 10, 2026",
    endDate: "Aug 28, 2026",
  },
  {
    id: "CAM-2006",
    name: "Holiday Product Push",
    business: "Growth Labs",
    businessId: "BUS-1001",
    objective: "Conversions",
    status: "Paused",
    platforms: ["Instagram", "Facebook"],
    posts: 15,
    published: 7,
    reach: "43.8K",
    engagement: "5.4%",
    startDate: "Aug 18, 2026",
    endDate: "Sep 18, 2026",
  },
  {
    id: "CAM-2007",
    name: "Re-engagement Campaign",
    business: "Craft House",
    businessId: "BUS-1006",
    objective: "Engagement",
    status: "Failed",
    platforms: ["Instagram"],
    posts: 6,
    published: 2,
    reach: "3.2K",
    engagement: "2.1%",
    startDate: "Sep 01, 2026",
    endDate: "Sep 14, 2026",
  },
];

const statusStyles: Record<CampaignStatus, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Completed: "bg-muted text-muted-foreground",
  Paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Failed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function AdminCampaignsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | CampaignStatus>("All");
  const [objective, setObjective] = useState("All");

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesSearch =
        !query ||
        campaign.name.toLowerCase().includes(query) ||
        campaign.business.toLowerCase().includes(query) ||
        campaign.id.toLowerCase().includes(query) ||
        campaign.objective.toLowerCase().includes(query);

      const matchesStatus =
        status === "All" || campaign.status === status;

      const matchesObjective =
        objective === "All" || campaign.objective === objective;

      return matchesSearch && matchesStatus && matchesObjective;
    });
  }, [search, status, objective]);

  const active = campaigns.filter((c) => c.status === "Active").length;
  const scheduled = campaigns.filter((c) => c.status === "Scheduled").length;
  const completed = campaigns.filter((c) => c.status === "Completed").length;
  const failed = campaigns.filter((c) => c.status === "Failed").length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/admin/dashboard"
              className="hover:text-foreground"
            >
              Admin
            </Link>

            <span>/</span>

            <span>Campaigns</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Campaign Management
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor campaigns, performance, publishing and campaign status.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </button>
      </div>

      {/* Demo notice */}
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

        <div>
          <p className="text-sm font-medium">Demo campaign data</p>

          <p className="mt-1 text-xs text-muted-foreground">
            Campaign records are currently displayed using frontend mock data.
            Backend integration will be added in the API integration stage.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Active"
          value={active}
          icon={<Target className="h-4 w-4" />}
        />

        <StatCard
          label="Scheduled"
          value={scheduled}
          icon={<CalendarDays className="h-4 w-4" />}
        />

        <StatCard
          label="Completed"
          value={completed}
          icon={<BarChart3 className="h-4 w-4" />}
        />

        <StatCard
          label="Failed"
          value={failed}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Main panel */}
      <section className="overflow-hidden rounded-xl border border-border bg-background">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search campaigns, businesses or IDs..."
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
                    event.target.value as "All" | CampaignStatus,
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none focus:border-foreground sm:w-40"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <select
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground sm:w-48"
            >
              <option value="All">All Objectives</option>
              <option value="Brand Awareness">Brand Awareness</option>
              <option value="Product Launch">Product Launch</option>
              <option value="Conversions">Conversions</option>
              <option value="Lead Generation">Lead Generation</option>
              <option value="Engagement">Engagement</option>
            </select>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Objective</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Posts</th>
                <th className="px-5 py-3 font-medium">Reach</th>
                <th className="px-5 py-3 font-medium">Engagement</th>
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCampaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-4">
                    <div>
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {campaign.name}
                      </Link>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {campaign.id}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/businesses/${campaign.businessId}`}
                      className="text-sm hover:underline"
                    >
                      {campaign.business}
                    </Link>
                  </td>

                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {campaign.objective}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[campaign.status]}`}
                    >
                      {campaign.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {campaign.published}/{campaign.posts}
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {campaign.reach}
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {campaign.engagement}
                  </td>

                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {campaign.startDate}
                    <br />
                    {campaign.endDate}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-border lg:hidden">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="block text-sm font-medium hover:underline"
                  >
                    {campaign.name}
                  </Link>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {campaign.id}
                  </p>
                </div>

                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
                  aria-label="Campaign actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[campaign.status]}`}
                >
                  {campaign.status}
                </span>

                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {campaign.objective}
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {campaign.business}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniMetric
                  label="Posts"
                  value={`${campaign.published}/${campaign.posts}`}
                />

                <MiniMetric
                  label="Reach"
                  value={campaign.reach}
                />

                <MiniMetric
                  label="Engagement"
                  value={campaign.engagement}
                />
              </div>

              <Link
                href={`/admin/campaigns/${campaign.id}`}
                className="mt-4 flex h-9 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
              >
                <Eye className="h-4 w-4" />
                View Campaign
              </Link>
            </div>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="px-6 py-16 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground" />

            <h3 className="mt-3 text-sm font-medium">
              No campaigns found
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
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

function StatCard({
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

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
