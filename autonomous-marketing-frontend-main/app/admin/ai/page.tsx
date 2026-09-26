"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cpu,
  FileText,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";

const metrics = [
  {
    title: "AI Runs",
    value: "96,284",
    change: "+28.6%",
    icon: Bot,
  },
  {
    title: "Success Rate",
    value: "97.8%",
    change: "+1.4%",
    icon: CheckCircle2,
  },
  {
    title: "Avg. Latency",
    value: "2.84s",
    change: "-12.8%",
    icon: Clock3,
  },
  {
    title: "AI Tokens",
    value: "18.4M",
    change: "+22.1%",
    icon: Cpu,
  },
];

const models = [
  {
    name: "Primary Generation Model",
    runs: "48,284",
    tokens: "9.8M",
    success: "98.4%",
    latency: "2.1s",
  },
  {
    name: "Content Analysis Model",
    runs: "26,418",
    tokens: "4.7M",
    success: "97.9%",
    latency: "1.8s",
  },
  {
    name: "Strategy Model",
    runs: "14,628",
    tokens: "3.1M",
    success: "96.8%",
    latency: "3.4s",
  },
  {
    name: "Classification Model",
    runs: "7,954",
    tokens: "0.8M",
    success: "99.2%",
    latency: "0.9s",
  },
];

const recentRuns = [
  {
    id: "RUN-92841",
    task: "Campaign Generation",
    business: "Beyond Stories",
    status: "Completed",
    duration: "2.4s",
  },
  {
    id: "RUN-92840",
    task: "Content Optimization",
    business: "Nova Retail",
    status: "Completed",
    duration: "1.8s",
  },
  {
    id: "RUN-92839",
    task: "Audience Analysis",
    business: "Growth Labs",
    status: "Completed",
    duration: "3.1s",
  },
  {
    id: "RUN-92838",
    task: "Post Generation",
    business: "Urban Goods",
    status: "Running",
    duration: "1.2s",
  },
];

export default function AdminAIPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
              <span>/</span>
              <span>AI</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              AI & Agent Monitoring
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor AI workloads, agents, models and execution health.
            </p>
          </div>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Notice */}
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="text-sm font-medium">
                AI monitoring data is currently mocked
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                The monitoring interface is ready. Live agent execution,
                model metrics and error data will be connected during Admin
                API Integration.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="text-xs font-medium">
                    {metric.change}
                  </span>
                </div>

                <p className="mt-5 text-sm text-muted-foreground">
                  {metric.title}
                </p>

                <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
              </div>
            );
          })}
        </div>

        {/* AI health */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">AI Service Health</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Current status of AI infrastructure
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-foreground" />
              Operational
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Agent Runtime", "Operational", "99.98% uptime"],
              ["Model Gateway", "Operational", "99.99% uptime"],
              ["Task Queue", "Operational", "142 queued"],
              ["AI Storage", "Operational", "Healthy"],
            ].map(([name, status, detail]) => (
              <div
                key={name}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{name}</p>
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <p className="mt-3 text-sm">{status}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Model performance */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-semibold">Model Performance</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Usage and execution performance by model
              </p>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Model</th>
                  <th className="px-5 py-3 font-medium">Runs</th>
                  <th className="px-5 py-3 font-medium">Tokens</th>
                  <th className="px-5 py-3 font-medium">Success</th>
                  <th className="px-5 py-3 font-medium">Latency</th>
                </tr>
              </thead>

              <tbody>
                {models.map((model) => (
                  <tr
                    key={model.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">{model.name}</td>
                    <td className="px-5 py-4">{model.runs}</td>
                    <td className="px-5 py-4">{model.tokens}</td>
                    <td className="px-5 py-4">{model.success}</td>
                    <td className="px-5 py-4">{model.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {models.map((model) => (
              <div key={model.name} className="space-y-3 p-5">
                <p className="font-medium">{model.name}</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Runs</p>
                    <p className="mt-1 font-medium">{model.runs}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tokens</p>
                    <p className="mt-1 font-medium">{model.tokens}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success</p>
                    <p className="mt-1 font-medium">{model.success}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Latency</p>
                    <p className="mt-1 font-medium">{model.latency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent runs */}
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-semibold">Recent AI Runs</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest agent executions
              </p>
            </div>

            <Link
              href="/admin/ai/runs"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View all
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Zap className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">{run.task}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {run.id} · {run.business}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <span className="text-xs text-muted-foreground">
                    {run.duration}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {run.status === "Running" ? (
                      <Activity className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {run.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/ai/runs"
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <Activity className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">AI Runs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Inspect individual AI executions and their performance.
            </p>
            <ChevronRight className="mt-4 h-4 w-4" />
          </Link>

          <Link
            href="/admin/ai/errors"
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <AlertCircle className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">AI Errors</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Review failed runs, exceptions and retry states.
            </p>
            <ChevronRight className="mt-4 h-4 w-4" />
          </Link>

          <Link
            href="/admin/system"
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
          >
            <Activity className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">System Monitoring</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor infrastructure and background services.
            </p>
            <ChevronRight className="mt-4 h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          AI monitoring dashboard
          <span>•</span>
          Mock data
        </div>
      </div>
    </div>
  );
}
