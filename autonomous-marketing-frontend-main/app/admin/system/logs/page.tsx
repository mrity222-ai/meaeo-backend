"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Clock3,
  FileText,
  Info,
  RefreshCw,
  Search,
  Server,
} from "lucide-react";
import { useState } from "react";

const logs = [
  {
    time: "10:42:18",
    level: "INFO",
    service: "API",
    message: "Campaign request completed successfully",
    request: "REQ-92841",
  },
  {
    time: "10:41:52",
    level: "INFO",
    service: "Scheduler",
    message: "Campaign scheduler processed 24 pending posts",
    request: "JOB-18421",
  },
  {
    time: "10:41:21",
    level: "WARNING",
    service: "AI",
    message: "Model response latency exceeded normal threshold",
    request: "RUN-92837",
  },
  {
    time: "10:40:48",
    level: "ERROR",
    service: "Worker",
    message: "Background task failed and will be retried",
    request: "JOB-18418",
  },
  {
    time: "10:40:11",
    level: "INFO",
    service: "Database",
    message: "Connection pool health check completed",
    request: "DB-4821",
  },
];

export default function AdminSystemLogsPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.service.toLowerCase().includes(search.toLowerCase()) ||
      log.request.toLowerCase().includes(search.toLowerCase());

    const matchesLevel = level === "All" || log.level === level;

    return matchesSearch && matchesLevel;
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
              <span>Logs</span>
            </div>

            <h1 className="text-2xl font-semibold sm:text-3xl">
              System Logs
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Application, worker and infrastructure events.
            </p>
          </div>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm">
          Log entries are currently mocked. Production log streaming and
          retention will be connected during the integration phase.
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <FileText className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">Total Logs</p>
            <p className="mt-1 text-2xl font-semibold">284,821</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <AlertTriangle className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">Warnings</p>
            <p className="mt-1 text-2xl font-semibold">1,284</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <AlertCircle className="h-5 w-5" />
            <p className="mt-4 text-sm text-muted-foreground">Errors</p>
            <p className="mt-1 text-2xl font-semibold">184</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search logs..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative">
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="h-10 min-w-[150px] appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm"
            >
              <option>All</option>
              <option>INFO</option>
              <option>WARNING</option>
              <option>ERROR</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Level</th>
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium">Message</th>
                  <th className="px-5 py-3 font-medium">Reference</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={`${log.time}-${log.request}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4 text-muted-foreground">
                      {log.time}
                    </td>

                    <td className="px-5 py-4">
                      <LogLevel level={log.level} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2">
                        <Server className="h-3.5 w-3.5" />
                        {log.service}
                      </span>
                    </td>

                    <td className="px-5 py-4">{log.message}</td>

                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {log.request}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {filteredLogs.map((log) => (
              <div
                key={`${log.time}-${log.request}`}
                className="space-y-3 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {log.time}
                  </span>

                  <LogLevel level={log.level} />
                </div>

                <p className="text-sm font-medium">{log.message}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span>{log.service}</span>
                  <span className="font-mono">{log.request}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LogLevel({ level }: { level: string }) {
  if (level === "ERROR") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
        <AlertCircle className="h-3 w-3" />
        ERROR
      </span>
    );
  }

  if (level === "WARNING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
        <AlertTriangle className="h-3 w-3" />
        WARNING
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
      <Info className="h-3 w-3" />
      INFO
    </span>
  );
}
