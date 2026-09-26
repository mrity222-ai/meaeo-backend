"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Megaphone,
  MoreHorizontal,
  Users,
  AlertTriangle,
  Clock3,
  FileText,
  Server,
  Sparkles,
  TrendingUp,
  UserPlus,
  Zap,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";


const userGrowth = [
  { month: "Apr", value: 38 },
  { month: "May", value: 46 },
  { month: "Jun", value: 52 },
  { month: "Jul", value: 61 },
  { month: "Aug", value: 72 },
  { month: "Sep", value: 84 },
];

const recentActivity = [
  {
    icon: UserPlus,
    title: "New user registered",
    description: "A new workspace was created",
    time: "4 min ago",
  },
  {
    icon: Megaphone,
    title: "Campaign launched",
    description: "Summer Growth Campaign is now active",
    time: "18 min ago",
  },
  {
    icon: CircleDollarSign,
    title: "Subscription upgraded",
    description: "Business upgraded to Pro",
    time: "32 min ago",
  },
  {
    icon: CheckCircle2,
    title: "Campaign completed",
    description: "Product Launch Campaign completed",
    time: "1 hr ago",
  },
  {
    icon: AlertTriangle,
    title: "AI run failed",
    description: "Content generation requires attention",
    time: "2 hrs ago",
  },
];

const campaignStats = [
  { label: "Active", value: "1,284", percentage: 58 },
  { label: "Scheduled", value: "624", percentage: 28 },
  { label: "Completed", value: "218", percentage: 10 },
  { label: "Failed", value: "84", percentage: 4 },
];

const systemServices = [
  {
    name: "API",
    status: "Operational",
    latency: "42ms",
  },
  {
    name: "Database",
    status: "Operational",
    latency: "18ms",
  },
  {
    name: "Scheduler",
    status: "Operational",
    latency: "—",
  },
  {
    name: "AI Services",
    status: "Operational",
    latency: "680ms",
  },
  {
    name: "Storage",
    status: "Operational",
    latency: "24ms",
  },
];

const aiMetrics = [
  {
    label: "AI Runs Today",
    value: "4,826",
    icon: Bot,
  },
  {
    label: "Successful",
    value: "4,712",
    icon: CheckCircle2,
  },
  {
    label: "Failed",
    value: "114",
    icon: AlertTriangle,
  },
  {
    label: "Avg. Runtime",
    value: "2.4s",
    icon: Clock3,
  },
];

function StatCard({
  title,
  value,
  change,
  trend,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
          <Icon className="h-5 w-5 text-purple-700" />
        </div>

        <button
          type="button"
          className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
          aria-label={`More options for ${title}`}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-neutral-500">{title}</p>

        <div className="mt-1 flex items-end gap-3">
          <p className="text-2xl font-semibold tracking-tight text-neutral-950">
            {value}
          </p>

          <span className="mb-1 inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {change}
          </span>
        </div>

        <p className="mt-1 text-xs text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        )}
      </div>

      {action && (
        <Button variant="ghost" size="sm" className="shrink-0">
          {action}
        </Button>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [statsData, setStatsData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [statsRes, usersRes, bizRes] = await Promise.all([
        apiRequest<{ status: string; stats: Record<string, any> }>("/admin/stats").catch(() => null),
        apiRequest<any[]>("/admin/users").catch(() => []),
        apiRequest<any[]>("/admin/businesses").catch(() => []),
      ]);
      if (statsRes?.stats) setStatsData(statsRes.stats);
      if (usersRes) setUsers(usersRes);
      if (bizRes) setBusinesses(bizRes);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  const liveStats = [
    {
      title: "Total Users",
      value: (statsData?.total_users ?? users.length).toString(),
      change: "Live DB",
      trend: "up",
      icon: Users,
      description: "Registered platform accounts",
    },
    {
      title: "Active Businesses",
      value: (statsData?.active_businesses ?? businesses.length).toString(),
      change: "Live DB",
      trend: "up",
      icon: BriefcaseBusiness,
      description: "Active business workspaces",
    },
    {
      title: "Active Campaigns",
      value: (statsData?.active_campaigns ?? 0).toString(),
      change: "Live",
      trend: "up",
      icon: Megaphone,
      description: "Campaigns in execution",
    },
    {
      title: "Connected Channels",
      value: (statsData?.total_channels ?? 0).toString(),
      change: "Social",
      trend: "up",
      icon: CircleDollarSign,
      description: "Active social platform accounts",
    },
  ];

  const liveRecentActivity = [
    ...users.slice(0, 3).map((u) => ({
      icon: UserPlus,
      title: `User: ${u.email}`,
      description: `Workspace: ${u.company} • Status: ${u.status}`,
      time: u.joined || "Recently",
    })),
    ...businesses.slice(0, 3).map((b) => ({
      icon: BriefcaseBusiness,
      title: `Business: ${b.name}`,
      description: `Owner: ${b.owner} • Category: ${b.category}`,
      time: b.created || "Recently",
    })),
  ];

  return (
    <div className="min-h-full bg-neutral-50">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>Admin</span>
              <span>/</span>
              <span className="font-medium text-neutral-950">Dashboard</span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Platform Dashboard
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Monitor your marketing platform, real-time users, campaigns and AI activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>

            <Link href="/admin/users">
              <Button size="sm">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {liveStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </section>

        {/* Charts */}
        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          {/* User Growth */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="User Growth"
              description="New user registrations over the last 6 months"
              action="Last 6 months"
            />

            <div className="mt-8">
              <div className="flex h-64 items-end gap-3 sm:gap-6">
                {userGrowth.map((item) => (
                  <div
                    key={item.month}
                    className="flex h-full flex-1 flex-col justify-end"
                  >
                    <div className="mb-2 text-center text-xs font-medium text-neutral-500">
                      {item.value}k
                    </div>

                    <div
                      className="rounded-t-lg bg-purple-600/80 transition-all hover:bg-purple-600"
                      style={{ height: `${item.value * 2.2}px` }}
                    />

                    <div className="mt-3 text-center text-xs text-neutral-500">
                      {item.month}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign Overview */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Campaign Overview"
              description="Current campaign distribution"
            />

            <div className="space-y-5">
              {campaignStats.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-500">{item.label}</span>
                    <span className="font-medium text-neutral-900">
                      {item.value}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-purple-600"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-5">
              <div>
                <p className="text-xs text-neutral-500">Total Campaigns</p>
                <p className="mt-1 text-lg font-semibold text-neutral-950">
                  2,210
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500">Success Rate</p>
                <p className="mt-1 text-lg font-semibold text-neutral-950">
                  96.2%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Metrics */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeader
            title="AI Activity"
            description="Autonomous marketing agent activity today"
            action="View AI Activity"
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {aiMetrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white">
                    <Icon className="h-5 w-5 text-purple-600" />
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-950">
                      {metric.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Activity + System */}
        <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          {/* Recent Activity */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="Recent Activity"
              description="Latest events across the platform"
              action="View All"
            />

            <div className="divide-y divide-neutral-100">
              {(liveRecentActivity.length > 0 ? liveRecentActivity : recentActivity).map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    key={`${activity.title}-${activity.time}`}
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-100 bg-purple-50">
                      <Icon className="h-4 w-4 text-purple-700" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {activity.title}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {activity.description}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-neutral-400">
                      {activity.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Health */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title="System Health"
              description="Current platform service status"
              action="View System"
            />

            <div className="space-y-2">
              {systemServices.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
                    <Server className="h-4 w-4 text-emerald-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {service.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {service.latency !== "—"
                        ? `Latency ${service.latency}`
                        : "Background service"}
                    </p>
                  </div>

                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <SectionHeader
            title="Quick Actions"
            description="Frequently used administration tools"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/admin/users">
                <Users className="mr-3 h-5 w-5 text-purple-600" />
                <span className="text-left">
                  <span className="block font-medium">Manage Users</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    View and manage accounts
                  </span>
                </span>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/admin/campaigns">
                <Megaphone className="mr-3 h-5 w-5 text-purple-600" />
                <span className="text-left">
                  <span className="block font-medium">Campaigns</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    Monitor campaigns
                  </span>
                </span>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/admin/settings">
                <Zap className="mr-3 h-5 w-5 text-purple-600" />
                <span className="text-left">
                  <span className="block font-medium">.env System Settings</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    API Keys & OAuth config
                  </span>
                </span>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto justify-start p-4"
              asChild
            >
              <Link href="/admin/support">
                <Activity className="mr-3 h-5 w-5 text-purple-600" />
                <span className="text-left">
                  <span className="block font-medium">Support Tickets</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    Client help requests
                  </span>
                </span>
              </Link>
            </Button>
          </div>
        </section>

        {/* AI Insight */}
        <section className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold text-purple-950">
                Platform AI Insight
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-purple-900">
                Campaign activity is currently trending upward. User
                registrations and active campaigns have both increased this
                month. AI execution success remains above 97%, with a small
                number of failed runs requiring review.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0 bg-white"
            >
              View AI Reports
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}