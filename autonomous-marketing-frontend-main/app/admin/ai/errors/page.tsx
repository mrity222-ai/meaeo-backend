"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Filter,
  RefreshCw,
  Search,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const errors = [
  {
    id: "ERR-4821",
    run: "RUN-92837",
    type: "Model Timeout",
    agent: "Brand Analysis",
    business: "Pixel House",
    severity: "High",
    status: "Retrying",
    time: "12 min ago",
  },
  {
    id: "ERR-4820",
    run: "RUN-92794",
    type: "Provider Error",
    agent: "Content Generator",
    business: "Nova Retail",
    severity: "Medium",
    status: "Resolved",
    time: "28 min ago",
  },
  {
    id: "ERR-4819",
    run: "RUN-92772",
    type: "Validation Error",
    agent: "Campaign Planner",
    business: "Growth Labs",
    severity: "Low",
    status: "Resolved",
    time: "41 min ago",
  },
  {
    id: "ERR-4818",
    run: "RUN-92754",
    type: "Rate Limit",
    agent: "Post Generator",
    business: "Urban Goods",
    severity: "Medium",
    status: "Retrying",
    time: "52 min ago",
  },
];

export default function AdminAIErrorsPage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("All");

  const filteredErrors = errors.filter((error) => {
    const matchesSearch =
      error.id.toLowerCase().includes(search.toLowerCase()) ||
      error.type.toLowerCase().includes(search.toLowerCase()) ||
      error.business.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity =
      severity === "All" || error.severity === severity;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin">Admin</Link>
              <span>/</span>
              <Link href="/admin/ai">AI</Link>
              <span>/</span>
              <span>Errors</span>
            </div>

            <h1 className="text-2xl font-semibold sm:text-3xl">AI Errors</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Review AI execution failures and retry activity.
            </p>
          </div>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm">
          Error records are currently mocked. Backend error tracking will be
          connected during API integration.
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <AlertCircle className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">
              Total Errors
            </p>
            <p className="mt-1 text-2xl font-semibold">1,728</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <AlertTriangle className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">Open Issues</p>
            <p className="mt-1 text-2xl font-semibold">84</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <RotateCcw className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">
              Retrying
            </p>
            <p className="mt-1 text-2xl font-semibold">31</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search errors..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative">
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="h-10 min-w-[150px] appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm"
            >
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </div>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Error</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>

              <tbody>
                {filteredErrors.map((error) => (
                  <tr
                    key={error.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">
                      {error.id}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {error.run}
                      </p>
                    </td>

                    <td className="px-5 py-4">{error.type}</td>
                    <td className="px-5 py-4">{error.agent}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {error.business}
                    </td>

                    <td className="px-5 py-4">
                      <SeverityBadge severity={error.severity} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={error.status} />
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      {error.time}
                    </td>

                    <td className="px-5 py-4">
                      <button className="rounded-lg p-2 hover:bg-muted">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {filteredErrors.map((error) => (
              <div key={error.id} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{error.type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {error.id} · {error.run}
                    </p>
                  </div>

                  <SeverityBadge severity={error.severity} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Agent</p>
                    <p className="mt-1 font-medium">{error.agent}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Business</p>
                    <p className="mt-1 font-medium">{error.business}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="mt-1 font-medium">{error.status}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="mt-1 font-medium">{error.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      <AlertCircle className="h-3 w-3" />
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Resolved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
        <CheckCircle2 className="h-3 w-3" />
        Resolved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      <RotateCcw className="h-3 w-3" />
      Retrying
    </span>
  );
}
