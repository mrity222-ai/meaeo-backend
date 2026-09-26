"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  Filter,
  Globe2,
  LockKeyhole,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

type AuditSeverity = "info" | "success" | "warning" | "critical";

type AuditLog = {
  id: string;
  timestamp: string;
  actor: string;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  description: string;
  severity: AuditSeverity;
  ipAddress: string;
  location: string;
  userAgent: string;
  status: "success" | "failed";
};

const auditLogs: AuditLog[] = [
  {
    id: "AUD-10081",
    timestamp: "Sep 10, 2026 · 10:42 AM",
    actor: "Admin User",
    actorEmail: "admin@marketai.com",
    action: "Updated system settings",
    resource: "Admin Settings",
    resourceId: "settings",
    description:
      "Updated platform notification and security configuration.",
    severity: "warning",
    ipAddress: "103.82.14.21",
    location: "Mumbai, IN",
    userAgent: "Chrome · Windows",
    status: "success",
  },
  {
    id: "AUD-10080",
    timestamp: "Sep 10, 2026 · 10:31 AM",
    actor: "Sarah Wilson",
    actorEmail: "sarah@marketai.com",
    action: "Created campaign",
    resource: "Campaign",
    resourceId: "CMP-4821",
    description:
      "Created a new marketing campaign for a customer workspace.",
    severity: "success",
    ipAddress: "52.18.91.44",
    location: "London, UK",
    userAgent: "Edge · Windows",
    status: "success",
  },
  {
    id: "AUD-10079",
    timestamp: "Sep 10, 2026 · 09:58 AM",
    actor: "James Carter",
    actorEmail: "james@marketai.com",
    action: "Changed user role",
    resource: "User",
    resourceId: "USR-1932",
    description:
      "Changed workspace member role from Editor to Administrator.",
    severity: "warning",
    ipAddress: "34.91.22.18",
    location: "New York, US",
    userAgent: "Chrome · macOS",
    status: "success",
  },
  {
    id: "AUD-10078",
    timestamp: "Sep 10, 2026 · 09:41 AM",
    actor: "Unknown",
    actorEmail: "unknown",
    action: "Failed login attempt",
    resource: "Authentication",
    resourceId: "AUTH",
    description:
      "Multiple unsuccessful authentication attempts were detected.",
    severity: "critical",
    ipAddress: "185.44.91.72",
    location: "Unknown",
    userAgent: "Unknown",
    status: "failed",
  },
  {
    id: "AUD-10077",
    timestamp: "Sep 10, 2026 · 09:24 AM",
    actor: "Admin User",
    actorEmail: "admin@marketai.com",
    action: "Viewed user account",
    resource: "User",
    resourceId: "USR-1887",
    description:
      "Opened the user detail inspector for security review.",
    severity: "info",
    ipAddress: "103.82.14.21",
    location: "Mumbai, IN",
    userAgent: "Chrome · Windows",
    status: "success",
  },
  {
    id: "AUD-10076",
    timestamp: "Sep 10, 2026 · 08:52 AM",
    actor: "Michael Brown",
    actorEmail: "michael@marketai.com",
    action: "Updated subscription",
    resource: "Subscription",
    resourceId: "SUB-8231",
    description:
      "Changed customer subscription from Growth to Pro.",
    severity: "info",
    ipAddress: "18.221.33.90",
    location: "Chicago, US",
    userAgent: "Safari · macOS",
    status: "success",
  },
  {
    id: "AUD-10075",
    timestamp: "Sep 10, 2026 · 08:35 AM",
    actor: "Admin User",
    actorEmail: "admin@marketai.com",
    action: "Exported report",
    resource: "Report",
    resourceId: "RPT-392",
    description:
      "Exported the monthly platform performance report.",
    severity: "info",
    ipAddress: "103.82.14.21",
    location: "Mumbai, IN",
    userAgent: "Chrome · Windows",
    status: "success",
  },
  {
    id: "AUD-10074",
    timestamp: "Sep 10, 2026 · 08:16 AM",
    actor: "System",
    actorEmail: "system@marketai.com",
    action: "Security scan completed",
    resource: "Security",
    resourceId: "SCAN-901",
    description:
      "Scheduled security scan completed without critical findings.",
    severity: "success",
    ipAddress: "Internal",
    location: "Internal",
    userAgent: "System Worker",
    status: "success",
  },
];

const severityConfig: Record<
  AuditSeverity,
  {
    label: string;
    className: string;
    icon: typeof Activity;
  }
> = {
  info: {
    label: "Info",
    className:
      "bg-muted text-muted-foreground border-border",
    icon: Activity,
  },
  success: {
    label: "Success",
    className:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  warning: {
    label: "Warning",
    className:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    className:
      "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",
    icon: XCircle,
  },
};

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AuditLog["status"] }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Success
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      <XCircle className="h-3.5 w-3.5" />
      Failed
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [resource, setResource] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return auditLogs.filter((log) => {
      const matchesSearch =
        !query ||
        log.id.toLowerCase().includes(query) ||
        log.actor.toLowerCase().includes(query) ||
        log.actorEmail.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.resource.toLowerCase().includes(query) ||
        log.ipAddress.toLowerCase().includes(query);

      const matchesSeverity =
        severity === "all" || log.severity === severity;

      const matchesStatus =
        status === "all" || log.status === status;

      const matchesResource =
        resource === "all" ||
        log.resource.toLowerCase() === resource.toLowerCase();

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus &&
        matchesResource
      );
    });
  }, [search, severity, status, resource]);

  const criticalCount = auditLogs.filter(
    (log) => log.severity === "critical",
  ).length;

  const failedCount = auditLogs.filter(
    (log) => log.status === "failed",
  ).length;

  const warningCount = auditLogs.filter(
    (log) => log.severity === "warning",
  ).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Audit Logs & Security
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review administrative activity, security events,
            authentication attempts, and important platform changes.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Activity className="h-3.5 w-3.5" />
          Mock audit data
        </div>
      </div>

      {/* Security summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Events Today"
          value="1,284"
          description="Across the platform"
          icon={<Activity className="h-5 w-5" />}
        />

        <StatCard
          title="Failed Events"
          value={String(failedCount)}
          description="Requires review"
          icon={<XCircle className="h-5 w-5 text-red-500" />}
        />

        <StatCard
          title="Warnings"
          value={String(warningCount)}
          description="Security-sensitive actions"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
        />

        <StatCard
          title="Critical Events"
          value={String(criticalCount)}
          description="Immediate attention"
          icon={<LockKeyhole className="h-5 w-5 text-red-500" />}
        />
      </div>

      {/* Security status */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <h2 className="font-semibold">Security monitoring active</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Audit events are being recorded for administrative
                and security-sensitive activity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-current" />
            Monitoring operational
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Audit filters</h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_160px_180px]">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search user, action, resource, IP..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-foreground/30"
            />
          </div>

          {/* Severity */}
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="all">All severities</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          {/* Resource */}
          <select
            value={resource}
            onChange={(event) => setResource(event.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="all">All resources</option>
            <option value="user">User</option>
            <option value="campaign">Campaign</option>
            <option value="authentication">Authentication</option>
            <option value="subscription">Subscription</option>
            <option value="security">Security</option>
            <option value="report">Report</option>
            <option value="admin settings">Admin Settings</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Showing recent activity
          <span>•</span>
          {filteredLogs.length} events
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Event
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Actor
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resource
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Severity
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Time
                </th>
                <th className="px-5 py-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const expanded = expandedId === log.id;

                return (
                  <tr key={log.id} className="align-top">
                    <td colSpan={7} className="p-0">
                      <div className="grid grid-cols-[minmax(260px,1.8fr)_minmax(180px,1fr)_minmax(150px,.8fr)_120px_100px_170px_44px] items-center">
                        <div className="px-5 py-4">
                          <p className="text-sm font-medium">
                            {log.action}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {log.id}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <p className="text-sm font-medium">
                            {log.actor}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {log.actorEmail}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <p className="text-sm">{log.resource}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {log.resourceId}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <SeverityBadge severity={log.severity} />
                        </div>

                        <div className="px-5 py-4">
                          <StatusBadge status={log.status} />
                        </div>

                        <div className="px-5 py-4">
                          <p className="text-xs text-muted-foreground">
                            {log.timestamp}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : log.id)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
                            aria-label={
                              expanded
                                ? "Hide audit details"
                                : "Show audit details"
                            }
                          >
                            {expanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="border-t border-border bg-muted/20 px-5 py-5">
                          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Description
                              </p>
                              <p className="mt-1 text-sm">
                                {log.description}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                IP Address
                              </p>
                              <p className="mt-1 flex items-center gap-2 text-sm">
                                <Globe2 className="h-4 w-4 text-muted-foreground" />
                                {log.ipAddress}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Location
                              </p>
                              <p className="mt-1 text-sm">
                                {log.location}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Device
                              </p>
                              <p className="mt-1 text-sm">
                                {log.userAgent}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
            <Eye className="h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No audit events found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* Mobile / tablet cards */}
      <div className="space-y-3 lg:hidden">
        {filteredLogs.map((log) => {
          const expanded = expandedId === log.id;

          return (
            <div
              key={log.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{log.action}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {log.id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : log.id)
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border"
                  >
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <SeverityBadge severity={log.severity} />
                  <StatusBadge status={log.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Actor
                    </p>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{log.actor}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Resource
                    </p>
                    <p className="mt-1 truncate">{log.resource}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Time
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{log.timestamp}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      IP Address
                    </p>
                    <p className="mt-1 truncate">{log.ipAddress}</p>
                  </div>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Event details
                  </p>

                  <p className="mt-2 text-sm">{log.description}</p>

                  <div className="mt-4 grid gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Email:
                      </span>{" "}
                      {log.actorEmail}
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Resource ID:
                      </span>{" "}
                      {log.resourceId}
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Location:
                      </span>{" "}
                      {log.location}
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Device:
                      </span>{" "}
                      {log.userAgent}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <Eye className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">
              No audit events found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredLogs.length}
          </span>{" "}
          recent events
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="rounded-lg border border-border px-3 py-2 text-sm opacity-50"
          >
            Previous
          </button>

          <span className="rounded-lg bg-foreground px-3 py-2 text-sm text-background">
            1
          </span>

          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
