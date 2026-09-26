"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  HardDrive,
  RefreshCw,
  Server,
  Settings2,
  Users,
  Workflow,
} from "lucide-react";

const services = [
  {
    name: "API Server",
    status: "Operational",
    uptime: "99.99%",
    latency: "84ms",
    icon: Server,
  },
  {
    name: "Database",
    status: "Operational",
    uptime: "99.98%",
    latency: "18ms",
    icon: Database,
  },
  {
    name: "Campaign Scheduler",
    status: "Operational",
    uptime: "99.97%",
    latency: "42ms",
    icon: Workflow,
  },
  {
    name: "Background Workers",
    status: "Operational",
    uptime: "99.96%",
    latency: "126ms",
    icon: Activity,
  },
];

const infrastructure = [
  ["CPU Usage", "42%", "Normal"],
  ["Memory Usage", "61%", "Normal"],
  ["Database Storage", "38%", "Healthy"],
  ["Queue Depth", "142", "Normal"],
];

export default function AdminSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin">Admin</Link>
              <span>/</span>
              <span>System</span>
            </div>

            <h1 className="text-2xl font-semibold sm:text-3xl">
              System Monitoring
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor infrastructure, services, workers and background jobs.
            </p>
          </div>

          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm">
          System metrics are currently mocked. Live infrastructure telemetry
          will be connected during Admin API Integration.
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.name}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>

                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <p className="mt-5 font-medium">{service.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {service.status}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="mt-1 font-medium">{service.uptime}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Latency</p>
                    <p className="mt-1 font-medium">{service.latency}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <div>
            <h2 className="font-semibold">Infrastructure</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Current resource utilization
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {infrastructure.map(([name, value, status]) => (
              <div key={name} className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">{name}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-xs">{status}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/system/health" className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">Health Checks</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Service health and connectivity.
            </p>
            <ArrowUpRight className="mt-4 h-4 w-4" />
          </Link>

          <Link href="/admin/system/jobs" className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40">
            <Workflow className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">Background Jobs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Scheduler and worker activity.
            </p>
            <ArrowUpRight className="mt-4 h-4 w-4" />
          </Link>

          <Link href="/admin/system/logs" className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40">
            <FileText className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">System Logs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Application and infrastructure logs.
            </p>
            <ArrowUpRight className="mt-4 h-4 w-4" />
          </Link>

          <Link href="/admin/settings" className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40">
            <Settings2 className="h-5 w-5" />
            <h3 className="mt-4 font-semibold">System Settings</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure administrative system options.
            </p>
            <ArrowUpRight className="mt-4 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
