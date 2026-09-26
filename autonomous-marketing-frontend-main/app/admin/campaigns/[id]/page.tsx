"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Facebook,
  Instagram,
  Linkedin,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

const campaign = {
  id: "CAM-2001",
  name: "Summer Growth Campaign",
  business: "Growth Labs",
  businessId: "BUS-1001",
  objective: "Brand Awareness",
  status: "Active",
  startDate: "September 02, 2026",
  endDate: "September 30, 2026",
  description:
    "AI-powered summer campaign focused on increasing brand awareness, engagement and audience growth across social platforms.",
};

const posts = [
  {
    title: "5 Ways to Grow Your Business This Summer",
    platform: "Instagram",
    status: "Published",
    date: "Sep 08, 2026",
    engagement: "8.4%",
  },
  {
    title: "Your Summer Marketing Checklist",
    platform: "Facebook",
    status: "Published",
    date: "Sep 07, 2026",
    engagement: "6.9%",
  },
  {
    title: "Growth Strategy for Q4",
    platform: "LinkedIn",
    status: "Scheduled",
    date: "Sep 10, 2026",
    engagement: "—",
  },
  {
    title: "What Makes a High-Converting Campaign?",
    platform: "Instagram",
    status: "Pending Review",
    date: "Sep 11, 2026",
    engagement: "—",
  },
];

const activity = [
  {
    title: "Post published",
    description: "Instagram post successfully published.",
    time: "12 min ago",
    icon: CheckCircle2,
  },
  {
    title: "Content generated",
    description: "AI generated 4 new campaign posts.",
    time: "1 hour ago",
    icon: Sparkles,
  },
  {
    title: "Post scheduled",
    description: "LinkedIn post scheduled for September 10.",
    time: "3 hours ago",
    icon: CalendarDays,
  },
  {
    title: "Campaign updated",
    description: "Campaign targeting settings were updated.",
    time: "Yesterday",
    icon: Edit3,
  },
];

const platformIcons = {
  Instagram,
  Facebook,
  LinkedIn: Linkedin,
};

export default function AdminCampaignDetailPage() {
  const [status, setStatus] = useState(campaign.status);

  const isPaused = status === "Paused";

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground">
          Admin
        </Link>

        <ChevronRight className="h-4 w-4" />

        <Link href="/admin/campaigns" className="hover:text-foreground">
          Campaigns
        </Link>

        <ChevronRight className="h-4 w-4" />

        <span>{campaign.id}</span>
      </div>

      {/* Header */}
      <section className="rounded-2xl border border-border bg-background">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {campaign.name}
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  isPaused
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {status}
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {campaign.id} · {campaign.objective}
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
              {campaign.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <Link
                href={`/admin/businesses/${campaign.businessId}`}
                className="hover:text-foreground hover:underline"
              >
                {campaign.business}
              </Link>

              <span>
                {campaign.startDate} → {campaign.endDate}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                setStatus(isPaused ? "Active" : "Paused")
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              {isPaused ? (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <PauseCircle className="h-4 w-4" />
                  Pause
                </>
              )}
            </button>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground sm:px-6">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Demo campaign data — controls are UI-only until API integration.
        </div>
      </section>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Total Posts"
          value="18"
          detail="11 published"
          icon={<BarChart3 className="h-4 w-4" />}
        />

        <Metric
          label="Reach"
          value="84.2K"
          detail="+18.4% this campaign"
          icon={<Eye className="h-4 w-4" />}
        />

        <Metric
          label="Engagement"
          value="7.8%"
          detail="+1.9% vs average"
          icon={<Users className="h-4 w-4" />}
        />

        <Metric
          label="Progress"
          value="61%"
          detail="11 / 18 published"
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Main */}
        <div className="space-y-6">
          {/* Progress */}
          <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Campaign Progress</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Publishing progress across the campaign.
                </p>
              </div>

              <span className="text-sm font-semibold">61%</span>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: "61%" }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ProgressItem label="Published" value="11" />
              <ProgressItem label="Scheduled" value="4" />
              <ProgressItem label="Review" value="2" />
              <ProgressItem label="Failed" value="1" />
            </div>
          </section>

          {/* Posts */}
          <section className="overflow-hidden rounded-2xl border border-border bg-background">
            <div className="border-b border-border p-5 sm:p-6">
              <h2 className="font-semibold">Campaign Content</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Posts associated with this campaign.
              </p>
            </div>

            <div className="divide-y divide-border">
              {posts.map((post) => {
                const Icon =
                  platformIcons[
                    post.platform as keyof typeof platformIcons
                  ];

                return (
                  <div key={post.title} className="p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {post.title}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {post.platform} · {post.date}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                              post.status === "Published"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : post.status === "Scheduled"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : post.status === "Pending Review"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    : "bg-red-500/10 text-red-600"
                            }`}
                          >
                            {post.status}
                          </span>
                        </div>

                        <div className="mt-3 text-xs text-muted-foreground">
                          Engagement:{" "}
                          <span className="font-medium text-foreground">
                            {post.engagement}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Activity */}
          <section className="rounded-2xl border border-border bg-background">
            <div className="border-b border-border p-5 sm:p-6">
              <h2 className="font-semibold">Campaign Activity</h2>
            </div>

            <div className="divide-y divide-border">
              {activity.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={`${item.title}-${item.time}`}
                    className="flex gap-3 p-5 sm:p-6"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                        <p className="text-sm font-medium">
                          {item.title}
                        </p>

                        <span className="text-xs text-muted-foreground">
                          {item.time}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule */}
          <section className="rounded-2xl border border-border bg-background">
            <div className="border-b border-border p-5">
              <h2 className="font-semibold">Schedule</h2>
            </div>

            <div className="space-y-4 p-5">
              <Info
                icon={<CalendarDays className="h-4 w-4" />}
                label="Start Date"
                value={campaign.startDate}
              />

              <Info
                icon={<CalendarDays className="h-4 w-4" />}
                label="End Date"
                value={campaign.endDate}
              />

              <Info
                icon={<Clock3 className="h-4 w-4" />}
                label="Publishing Frequency"
                value="4 posts / week"
              />
            </div>
          </section>

          {/* Platforms */}
          <section className="rounded-2xl border border-border bg-background">
            <div className="border-b border-border p-5">
              <h2 className="font-semibold">Platforms</h2>
            </div>

            <div className="divide-y divide-border">
              {[
                ["Instagram", Instagram, "7 posts"],
                ["Facebook", Facebook, "6 posts"],
                ["LinkedIn", Linkedin, "5 posts"],
              ].map(([name, Icon, count]) => {
                const PlatformIcon =
                  Icon as typeof Instagram;

                return (
                  <div
                    key={name as string}
                    className="flex items-center gap-3 p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <PlatformIcon className="h-4 w-4" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {name as string}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {count as string}
                      </p>
                    </div>

                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* AI */}
          <section className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Sparkles className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">AI Activity</h2>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  18 content generations completed for this campaign.
                </p>

                <p className="mt-3 text-xs">
                  <span className="font-medium">17 successful</span>
                  <span className="mx-1 text-muted-foreground">·</span>
                  <span className="text-red-600 dark:text-red-400">
                    1 failed
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Health */}
          <section className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-start gap-3">
              {isPaused ? (
                <PauseCircle className="h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}

              <div>
                <h2 className="text-sm font-semibold">
                  Campaign Health
                </h2>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {isPaused
                    ? "Campaign is currently paused."
                    : "Campaign is running normally with no current issues."}
                </p>
              </div>
            </div>
          </section>

          <Link
            href="/admin/campaigns"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>

        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ProgressItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm">{value}</p>
      </div>
    </div>
  );
}
