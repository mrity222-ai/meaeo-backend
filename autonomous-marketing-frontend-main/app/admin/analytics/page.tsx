"use client";

import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  ChevronDown,
  FileText,
  Instagram,
  Linkedin,
  Megaphone,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

const kpis = [
  {
    title: "Monthly Active Users",
    value: "8,624",
    change: "+16.8%",
    positive: true,
    icon: Users,
  },
  {
    title: "Campaign Success",
    value: "87.4%",
    change: "+5.2%",
    positive: true,
    icon: Megaphone,
  },
  {
    title: "Content Generated",
    value: "184.7K",
    change: "+31.2%",
    positive: true,
    icon: FileText,
  },
  {
    title: "AI Runs",
    value: "96.2K",
    change: "+28.6%",
    positive: true,
    icon: Bot,
  },
];

const engagementData = [
  { month: "Jan", value: 4.2 },
  { month: "Feb", value: 4.8 },
  { month: "Mar", value: 5.1 },
  { month: "Apr", value: 5.7 },
  { month: "May", value: 6.2 },
  { month: "Jun", value: 6.6 },
  { month: "Jul", value: 7.1 },
  { month: "Aug", value: 7.8 },
];

const platformData = [
  {
    name: "Instagram",
    percentage: 42,
    engagement: "8.42%",
    icon: Instagram,
  },
  {
    name: "Facebook",
    percentage: 26,
    engagement: "6.74%",
    icon: Activity,
  },
  {
    name: "LinkedIn",
    percentage: 18,
    engagement: "7.91%",
    icon: Linkedin,
  },
  {
    name: "X",
    percentage: 14,
    engagement: "5.86%",
    icon: Activity,
  },
];

const topBusinesses = [
  {
    name: "Beyond Stories",
    campaigns: 28,
    posts: 184,
    engagement: "9.24%",
    growth: "+24%",
  },
  {
    name: "Nova Retail",
    campaigns: 22,
    posts: 142,
    engagement: "8.71%",
    growth: "+19%",
  },
  {
    name: "Growth Labs",
    campaigns: 18,
    posts: 126,
    engagement: "8.16%",
    growth: "+17%",
  },
  {
    name: "Urban Goods",
    campaigns: 15,
    posts: 98,
    engagement: "7.82%",
    growth: "+14%",
  },
];

const insights = [
  "Instagram currently produces the strongest average engagement across active campaigns.",
  "AI-generated content volume increased significantly over the selected reporting period.",
  "Campaign success rate is trending upward as more businesses use automated scheduling.",
];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("Last 30 days");

  const maxEngagement = Math.max(...engagementData.map((item) => item.value));

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
              <span>Analytics</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Platform Analytics
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor platform usage, campaign performance and AI activity.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
                className="h-10 min-w-[165px] appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 12 months</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Mock notice */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="text-sm font-medium">
                Analytics data is currently mocked
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                The interface is ready for backend integration. Live
                analytics, aggregation and reporting APIs will be connected
                later.
              </p>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-medium">
                    {item.positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {item.change}
                  </span>
                </div>

                <p className="mt-5 text-sm text-muted-foreground">
                  {item.title}
                </p>

                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* Engagement trend */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold">Engagement Trend</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Average campaign engagement percentage
              </p>
            </div>

            <div className="rounded-lg bg-muted px-3 py-2 text-right">
              <p className="text-[11px] text-muted-foreground">
                Current average
              </p>
              <p className="text-sm font-semibold">7.8%</p>
            </div>
          </div>

          <div className="mt-6 flex h-72 items-end gap-2 sm:gap-4">
            {engagementData.map((item) => {
              const height = `${(item.value / maxEngagement) * 100}%`;

              return (
                <div
                  key={item.month}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-full w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-foreground/80 transition-opacity hover:opacity-70"
                      style={{ height }}
                      title={`${item.value}%`}
                    />
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Platform + campaign */}
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5">
            <div>
              <h2 className="font-semibold">Platform Performance</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Distribution and engagement across social channels
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {platformData.map((platform) => {
                const Icon = platform.icon;

                return (
                  <div key={platform.name}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {platform.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {platform.engagement} engagement
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-semibold">
                        {platform.percentage}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground"
                        style={{ width: `${platform.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div>
              <h2 className="font-semibold">Campaign Health</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Current campaign operating metrics
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">
                  Active campaigns
                </p>
                <p className="mt-2 text-2xl font-semibold">2,184</p>
                <p className="mt-1 text-xs">+12.8% this month</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">
                  Scheduled posts
                </p>
                <p className="mt-2 text-2xl font-semibold">18,642</p>
                <p className="mt-1 text-xs">+21.4% this month</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">
                  Success rate
                </p>
                <p className="mt-2 text-2xl font-semibold">87.4%</p>
                <p className="mt-1 text-xs">+5.2% this month</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">
                  Failed executions
                </p>
                <p className="mt-2 text-2xl font-semibold">1.8%</p>
                <p className="mt-1 text-xs">-0.7% this month</p>
              </div>
            </div>
          </section>
        </div>

        {/* Top businesses */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Top Businesses</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Highest-performing businesses during {range.toLowerCase()}
              </p>
            </div>

            <Link
              href="/admin/businesses"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View businesses
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Campaigns</th>
                  <th className="px-5 py-3 font-medium">Posts</th>
                  <th className="px-5 py-3 font-medium">Engagement</th>
                  <th className="px-5 py-3 font-medium">Growth</th>
                </tr>
              </thead>

              <tbody>
                {topBusinesses.map((business) => (
                  <tr
                    key={business.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">{business.name}</td>
                    <td className="px-5 py-4">{business.campaigns}</td>
                    <td className="px-5 py-4">{business.posts}</td>
                    <td className="px-5 py-4 font-medium">
                      {business.engagement}
                    </td>
                    <td className="px-5 py-4">{business.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {topBusinesses.map((business) => (
              <div key={business.name} className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{business.name}</p>
                  <span className="text-sm font-medium">
                    {business.growth}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Campaigns</p>
                    <p className="mt-1 font-medium">{business.campaigns}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Posts</p>
                    <p className="mt-1 font-medium">{business.posts}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Engagement</p>
                    <p className="mt-1 font-medium">
                      {business.engagement}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI analytics */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">AI Analytics Insights</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Automated observations from platform activity
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {insights.map((insight, index) => (
              <div
                key={insight}
                className="flex items-start gap-3 rounded-lg border border-border p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {index + 1}
                </span>

                <p className="text-sm leading-6 text-muted-foreground">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer status */}
        <div className="flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            Analytics service operational
          </div>

          <div className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            Last updated just now
          </div>
        </div>
      </div>
    </div>
  );
}
