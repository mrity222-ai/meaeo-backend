"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Megaphone,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

const reportCards = [
  {
    title: "Total Users",
    value: "12,482",
    change: "+18.6%",
    description: "vs previous period",
    icon: Users,
  },
  {
    title: "Active Businesses",
    value: "4,286",
    change: "+12.4%",
    description: "vs previous period",
    icon: BarChart3,
  },
  {
    title: "Campaigns",
    value: "8,941",
    change: "+24.8%",
    description: "vs previous period",
    icon: Megaphone,
  },
  {
    title: "Content Generated",
    value: "184.7K",
    change: "+31.2%",
    description: "vs previous period",
    icon: FileText,
  },
];

const userGrowth = [
  { month: "Jan", users: 5200 },
  { month: "Feb", users: 6100 },
  { month: "Mar", users: 6900 },
  { month: "Apr", users: 7800 },
  { month: "May", users: 9100 },
  { month: "Jun", users: 10400 },
  { month: "Jul", users: 11600 },
  { month: "Aug", users: 12482 },
];

const campaignPerformance = [
  {
    campaign: "Summer Product Launch",
    business: "Beyond Stories",
    campaigns: 18,
    posts: 126,
    engagement: "8.42%",
    status: "Excellent",
  },
  {
    campaign: "Brand Awareness Q3",
    business: "Nova Retail",
    campaigns: 14,
    posts: 98,
    engagement: "7.86%",
    status: "Excellent",
  },
  {
    campaign: "Lead Generation",
    business: "Growth Labs",
    campaigns: 11,
    posts: 77,
    engagement: "6.94%",
    status: "Good",
  },
  {
    campaign: "Product Education",
    business: "Urban Goods",
    campaigns: 9,
    posts: 63,
    engagement: "6.21%",
    status: "Good",
  },
  {
    campaign: "Community Growth",
    business: "Pixel House",
    campaigns: 7,
    posts: 49,
    engagement: "5.82%",
    status: "Average",
  },
];

const platformUsage = [
  { name: "Instagram", value: 42, posts: "78.4K posts" },
  { name: "Facebook", value: 26, posts: "48.2K posts" },
  { name: "LinkedIn", value: 18, posts: "33.5K posts" },
  { name: "X", value: 14, posts: "24.6K posts" },
];

const monthlyRevenue = [
  { month: "Jan", value: 42000 },
  { month: "Feb", value: 47000 },
  { month: "Mar", value: 52000 },
  { month: "Apr", value: 58000 },
  { month: "May", value: 64000 },
  { month: "Jun", value: 71000 },
  { month: "Jul", value: 79000 },
  { month: "Aug", value: 87000 },
];

function formatRevenue(value: number) {
  return `$${(value / 1000).toFixed(0)}K`;
}

export default function AdminReportsPage() {
  const [range, setRange] = useState("Last 30 days");

  const maxUsers = Math.max(...userGrowth.map((item) => item.users));
  const maxRevenue = Math.max(...monthlyRevenue.map((item) => item.value));

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                href="/admin"
                className="transition-colors hover:text-foreground"
              >
                Admin
              </Link>
              <span>/</span>
              <span>Reports</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Reports
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Platform-wide reports and business performance summaries.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90">
              <ArrowDownToLine className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Mock notice */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="text-sm font-medium">
                Report data is currently mocked
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                These values represent the planned admin reporting interface.
                Real backend analytics will be connected during Admin API
                Integration.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <span className="text-sm font-medium">Reporting period</span>
          </div>

          <div className="relative">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="h-10 min-w-[170px] appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last 12 months</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reportCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {card.change}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-muted-foreground">
                    {card.title}
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* User growth + revenue */}
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">User Growth</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Registered users over time
                </p>
              </div>

              <button className="rounded-lg p-2 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex h-64 items-end gap-2 sm:gap-3">
              {userGrowth.map((item) => {
                const height = `${(item.users / maxUsers) * 100}%`;

                return (
                  <div
                    key={item.month}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-foreground/80 transition-opacity hover:opacity-70"
                        style={{ height }}
                        title={`${item.users.toLocaleString()} users`}
                      />
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Current users</p>
                <p className="mt-1 font-semibold">12,482</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Growth</p>
                <p className="mt-1 font-semibold">+18.6%</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Revenue Trend</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Monthly subscription revenue
                </p>
              </div>

              <button className="rounded-lg p-2 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex h-64 items-end gap-2 sm:gap-3">
              {monthlyRevenue.map((item) => {
                const height = `${(item.value / maxRevenue) * 100}%`;

                return (
                  <div
                    key={item.month}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-foreground/80 transition-opacity hover:opacity-70"
                        style={{ height }}
                        title={formatRevenue(item.value)}
                      />
                    </div>

                    <span className="text-[11px] text-muted-foreground">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Current MRR</p>
                <p className="mt-1 font-semibold">$87K</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Growth</p>
                <p className="mt-1 font-semibold">+22.4%</p>
              </div>
            </div>
          </section>
        </div>

        {/* Campaign performance */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Campaign Performance</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Top campaign activity across the platform
              </p>
            </div>

            <Link
              href="/admin/campaigns"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View campaigns
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Campaigns</th>
                  <th className="px-5 py-3 font-medium">Posts</th>
                  <th className="px-5 py-3 font-medium">Engagement</th>
                  <th className="px-5 py-3 font-medium">Performance</th>
                </tr>
              </thead>

              <tbody>
                {campaignPerformance.map((item) => (
                  <tr
                    key={item.campaign}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">{item.campaign}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {item.business}
                    </td>
                    <td className="px-5 py-4">{item.campaigns}</td>
                    <td className="px-5 py-4">{item.posts}</td>
                    <td className="px-5 py-4 font-medium">
                      {item.engagement}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border md:hidden">
            {campaignPerformance.map((item) => (
              <div key={item.campaign} className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.campaign}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.business}
                    </p>
                  </div>

                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Campaigns</p>
                    <p className="mt-1 font-medium">{item.campaigns}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Posts</p>
                    <p className="mt-1 font-medium">{item.posts}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Engagement</p>
                    <p className="mt-1 font-medium">{item.engagement}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Platform usage */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div>
            <h2 className="font-semibold">Platform Usage</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Content distribution by connected social platform
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformUsage.map((platform) => (
              <div
                key={platform.name}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{platform.name}</p>
                  <span className="text-sm font-semibold">
                    {platform.value}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${platform.value}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {platform.posts}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Report shortcuts */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/analytics"
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <TrendingUp className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">Advanced Analytics</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore detailed platform analytics and trends.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
              Open analytics
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <button className="group rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40">
            <CalendarDays className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">Scheduled Reports</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure recurring reports for administrators.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
              Configure
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          <button className="group rounded-xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40">
            <Clock3 className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">Report History</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Review previously generated admin reports.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
              View history
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}
