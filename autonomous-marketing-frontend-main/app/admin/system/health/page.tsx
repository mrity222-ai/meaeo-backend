"use client";

import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Database,
  Globe2,
  HardDrive,
  RefreshCw,
  Server,
  ShieldCheck,
  Wifi,
} from "lucide-react";

const checks = [
  ["API Server", "Operational", "84ms", Server],
  ["PostgreSQL", "Operational", "18ms", Database],
  ["Scheduler", "Operational", "42ms", Clock3],
  ["Worker Queue", "Operational", "126ms", Activity],
  ["Object Storage", "Operational", "31ms", HardDrive],
  ["OAuth Providers", "Operational", "218ms", Globe2],
  ["External APIs", "Operational", "184ms", Wifi],
  ["Security Services", "Operational", "12ms", ShieldCheck],
];

export default function AdminSystemHealthPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex gap-2 text-sm text-muted-foreground">
              <Link href="/admin">Admin</Link>
              <span>/</span>
              <Link href="/admin/system">System</Link>
              <span>/</span>
              <span>Health</span>
            </div>

            <h1 className="text-2xl font-semibold sm:text-3xl">
              System Health
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Service availability and connectivity checks.
            </p>
          </div>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
            Run Checks
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">All systems operational</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Last health check: just now
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {checks.map(([name, status, latency, Icon]) => {
            const ServiceIcon = Icon as typeof Server;

            return (
              <div
                key={name as string}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <ServiceIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-medium">{name as string}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {latency as string}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    {status as string}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
