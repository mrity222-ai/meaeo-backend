"use client";

import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const jobs = [
  {
    name: "campaign_scheduler",
    type: "Scheduler",
    status: "Running",
    executions: "18,421",
    failures: "24",
    duration: "1.4s",
    nextRun: "Every minute",
  },
  {
    name: "content_generation",
    type: "Worker",
    status: "Running",
    executions: "8,284",
    failures: "42",
    duration: "4.8s",
    nextRun: "Queue based",
  },
  {
    name: "analytics_aggregation",
    type: "Worker",
    status: "Completed",
    executions: "2,184",
    failures: "6",
    duration: "8.2s",
    nextRun: "Hourly",
  },
  {
    name: "subscription_sync",
    type: "Background",
    status: "Completed",
    executions: "842",
    failures: "2",
    duration: "3.1s",
    nextRun: "Every 6 hours",
  },
  {
    name: "cleanup_expired_data",
    type: "Maintenance",
    status: "Failed",
    executions: "184",
    failures: "4",
    duration: "12.4s",
    nextRun: "Daily",
  },
];

export default function AdminSystemJobsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.name.toLowerCase().includes(search.toLowerCase()) ||
      job.type.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = status === "All" || job.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex gap-2 text-sm text-muted-foreground">
              <Link href="/admin">Admin</Link>
              <span>/</span>
              <Link href="/admin/system">System</Link>
              <span>/</span>
              <span>Jobs</span>
            </div>

            <h1 className="text-2xl font-semibold sm:text-3xl">
              Background Jobs
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor scheduler, workers and recurring background jobs.
            </p>
          </div>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm">
          Job execution data is currently mocked and will be connected to the
          production scheduler later.
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Running</p>
            <p className="mt-2 text-2xl font-semibold">12</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Queued</p>
            <p className="mt-2 text-2xl font-semibold">142</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Failed Today</p>
            <p className="mt-2 text-2xl font-semibold">18</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search jobs..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 min-w-[150px] appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm"
            >
              <option>All</option>
              <option>Running</option>
              <option>Completed</option>
              <option>Failed</option>
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
                  <th className="px-5 py-3 font-medium">Job</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Executions</th>
                  <th className="px-5 py-3 font-medium">Failures</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Next Run</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>

              <tbody>
                {filteredJobs.map((job) => (
                  <tr
                    key={job.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4 font-medium">{job.name}</td>
                    <td className="px-5 py-4">{job.type}</td>
                    <td className="px-5 py-4">
                      <JobStatus status={job.status} />
                    </td>
                    <td className="px-5 py-4">{job.executions}</td>
                    <td className="px-5 py-4">{job.failures}</td>
                    <td className="px-5 py-4">{job.duration}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {job.nextRun}
                    </td>
                    <td className="px-5 py-4">
                      <button className="rounded-lg p-2 hover:bg-muted">
                        <Play className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {filteredJobs.map((job) => (
              <div key={job.name} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{job.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.type}
                    </p>
                  </div>

                  <JobStatus status={job.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Executions</p>
                    <p className="mt-1 font-medium">{job.executions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failures</p>
                    <p className="mt-1 font-medium">{job.failures}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="mt-1 font-medium">{job.duration}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Run</p>
                    <p className="mt-1 font-medium">{job.nextRun}</p>
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

function JobStatus({ status }: { status: string }) {
  if (status === "Running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
        <Activity className="h-3 w-3" />
        Running
      </span>
    );
  }

  if (status === "Failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      <CheckCircle2 className="h-3 w-3" />
      Completed
    </span>
  );
}
