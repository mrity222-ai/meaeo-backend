"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  Facebook,
  Filter,
  Instagram,
  Linkedin,
  Link2,
  RefreshCw,
  Search,
  ShieldCheck,
  Unplug,
  XCircle,
} from "lucide-react";

type Platform =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "X";

type ConnectionStatus =
  | "connected"
  | "warning"
  | "expired"
  | "disconnected";

type PlatformConnection = {
  id: string;
  platform: Platform;
  business: string;
  owner: string;
  status: ConnectionStatus;
  accountName: string;
  accountId: string;
  lastSync: string;
  tokenStatus: string;
  tokenExpiry: string;
  postsPublished: number;
  connectedAt: string;
};

const connections: PlatformConnection[] = [
  {
    id: "CON-1001",
    platform: "Instagram",
    business: "Beyond Stories",
    owner: "Aarav Mehta",
    status: "connected",
    accountName: "@beyondstories",
    accountId: "IG-829173",
    lastSync: "2 minutes ago",
    tokenStatus: "Healthy",
    tokenExpiry: "42 days",
    postsPublished: 128,
    connectedAt: "Aug 12, 2026",
  },
  {
    id: "CON-1002",
    platform: "Facebook",
    business: "Beyond Stories",
    owner: "Aarav Mehta",
    status: "connected",
    accountName: "Beyond Stories",
    accountId: "FB-729182",
    lastSync: "4 minutes ago",
    tokenStatus: "Healthy",
    tokenExpiry: "39 days",
    postsPublished: 94,
    connectedAt: "Aug 12, 2026",
  },
  {
    id: "CON-1003",
    platform: "LinkedIn",
    business: "Growth Labs",
    owner: "Priya Sharma",
    status: "warning",
    accountName: "Growth Labs",
    accountId: "LI-192837",
    lastSync: "36 minutes ago",
    tokenStatus: "Expiring soon",
    tokenExpiry: "6 days",
    postsPublished: 61,
    connectedAt: "Jul 28, 2026",
  },
  {
    id: "CON-1004",
    platform: "X",
    business: "Nova Digital",
    owner: "Daniel Smith",
    status: "expired",
    accountName: "@novadigital",
    accountId: "X-918273",
    lastSync: "2 days ago",
    tokenStatus: "Expired",
    tokenExpiry: "Expired",
    postsPublished: 47,
    connectedAt: "Jun 19, 2026",
  },
  {
    id: "CON-1005",
    platform: "Instagram",
    business: "Urban Brew",
    owner: "Neha Kapoor",
    status: "connected",
    accountName: "@urbanbrew",
    accountId: "IG-627381",
    lastSync: "8 minutes ago",
    tokenStatus: "Healthy",
    tokenExpiry: "51 days",
    postsPublished: 83,
    connectedAt: "Aug 30, 2026",
  },
  {
    id: "CON-1006",
    platform: "Facebook",
    business: "Urban Brew",
    owner: "Neha Kapoor",
    accountName: "Urban Brew",
    accountId: "FB-627382",
    status: "disconnected",
    lastSync: "Never",
    tokenStatus: "Not available",
    tokenExpiry: "—",
    postsPublished: 0,
    connectedAt: "Sep 2, 2026",
  },
  {
    id: "CON-1007",
    platform: "LinkedIn",
    business: "TechFlow",
    owner: "Rahul Verma",
    status: "connected",
    accountName: "TechFlow",
    accountId: "LI-472819",
    lastSync: "12 minutes ago",
    tokenStatus: "Healthy",
    tokenExpiry: "28 days",
    postsPublished: 72,
    connectedAt: "Aug 18, 2026",
  },
  {
    id: "CON-1008",
    platform: "X",
    business: "Pixel House",
    owner: "Emma Wilson",
    status: "connected",
    accountName: "@pixelhouse",
    accountId: "X-581029",
    lastSync: "15 minutes ago",
    tokenStatus: "Healthy",
    tokenExpiry: "31 days",
    postsPublished: 39,
    connectedAt: "Aug 22, 2026",
  },
];

const platformConfig: Record<
  Platform,
  {
    icon: typeof Instagram;
    label: string;
  }
> = {
  Instagram: {
    icon: Instagram,
    label: "Instagram",
  },
  Facebook: {
    icon: Facebook,
    label: "Facebook",
  },
  LinkedIn: {
    icon: Linkedin,
    label: "LinkedIn",
  },
  X: {
    icon: XCircle,
    label: "X",
  },
};

const statusConfig: Record<
  ConnectionStatus,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  connected: {
    label: "Connected",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  warning: {
    label: "Warning",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: AlertCircle,
  },
  expired: {
    label: "Expired",
    className:
      "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
    icon: XCircle,
  },
  disconnected: {
    label: "Disconnected",
    className:
      "border-border bg-muted text-muted-foreground",
    icon: Unplug,
  },
};

function StatusBadge({
  status,
}: {
  status: ConnectionStatus;
}) {
  const config = statusConfig[status];
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

function PlatformBadge({
  platform,
}: {
  platform: Platform;
}) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium">
      <Icon className="h-4 w-4" />
      {config.label}
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

export default function AdminConnectionsPage() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(
    null,
  );

  const filteredConnections = useMemo(() => {
    const query = search.trim().toLowerCase();

    return connections.filter((connection) => {
      const matchesSearch =
        !query ||
        connection.id.toLowerCase().includes(query) ||
        connection.business.toLowerCase().includes(query) ||
        connection.owner.toLowerCase().includes(query) ||
        connection.accountName.toLowerCase().includes(query) ||
        connection.platform.toLowerCase().includes(query);

      const matchesPlatform =
        platform === "all" ||
        connection.platform === platform;

      const matchesStatus =
        status === "all" ||
        connection.status === status;

      return (
        matchesSearch &&
        matchesPlatform &&
        matchesStatus
      );
    });
  }, [search, platform, status]);

  const connectedCount = connections.filter(
    (connection) => connection.status === "connected",
  ).length;

  const warningCount = connections.filter(
    (connection) => connection.status === "warning",
  ).length;

  const expiredCount = connections.filter(
    (connection) => connection.status === "expired",
  ).length;

  const disconnectedCount = connections.filter(
    (connection) => connection.status === "disconnected",
  ).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-6 w-6" />

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Platform Connections
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor system-wide OAuth connections, account health,
            token status, and social platform synchronization.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Link2 className="h-3.5 w-3.5" />
          Mock connection data
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Connections"
          value={String(connections.length)}
          description="Across all platforms"
          icon={<Link2 className="h-5 w-5" />}
        />

        <StatCard
          title="Healthy"
          value={String(connectedCount)}
          description="Active and synchronized"
          icon={
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          }
        />

        <StatCard
          title="Needs Attention"
          value={String(warningCount + expiredCount)}
          description={`${warningCount} warning · ${expiredCount} expired`}
          icon={
            <AlertCircle className="h-5 w-5 text-amber-500" />
          }
        />

        <StatCard
          title="Disconnected"
          value={String(disconnectedCount)}
          description="Not currently connected"
          icon={<Unplug className="h-5 w-5" />}
        />
      </div>

      {/* Connection health */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <h2 className="font-semibold">
                Connection monitoring active
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                OAuth and platform connection health is being
                monitored across customer workspaces.
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

          <h2 className="text-sm font-semibold">
            Connection filters
          </h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search business, owner, platform..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-foreground/30"
            />
          </div>

          <select
            value={platform}
            onChange={(event) =>
              setPlatform(event.target.value)
            }
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="all">All platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="X">X</option>
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="all">All statuses</option>
            <option value="connected">Connected</option>
            <option value="warning">Warning</option>
            <option value="expired">Expired</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          Showing {filteredConnections.length} of{" "}
          {connections.length} connections
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Platform
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Business
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Account
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Token
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Last Sync
                </th>

                <th className="px-5 py-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredConnections.map((connection) => {
                const expanded =
                  expandedId === connection.id;

                return (
                  <tr
                    key={connection.id}
                    className="align-top"
                  >
                    <td colSpan={7} className="p-0">
                      <div className="grid grid-cols-[150px_minmax(180px,1.2fr)_minmax(190px,1.2fr)_150px_150px_150px_50px] items-center">
                        <div className="px-5 py-4">
                          <PlatformBadge
                            platform={connection.platform}
                          />
                        </div>

                        <div className="px-5 py-4">
                          <p className="text-sm font-medium">
                            {connection.business}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {connection.owner}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <p className="text-sm font-medium">
                            {connection.accountName}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {connection.accountId}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <StatusBadge
                            status={connection.status}
                          />
                        </div>

                        <div className="px-5 py-4">
                          <p
                            className={`text-sm font-medium ${
                              connection.tokenStatus ===
                              "Healthy"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : connection.tokenStatus ===
                                    "Expired"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {connection.tokenStatus}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {connection.tokenExpiry}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <p className="text-sm">
                            {connection.lastSync}
                          </p>
                        </div>

                        <div className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(
                                expanded
                                  ? null
                                  : connection.id,
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
                            aria-label={
                              expanded
                                ? "Hide connection details"
                                : "Show connection details"
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
                          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Connection ID
                              </p>

                              <p className="mt-1 text-sm">
                                {connection.id}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Connected At
                              </p>

                              <p className="mt-1 text-sm">
                                {connection.connectedAt}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Posts Published
                              </p>

                              <p className="mt-1 text-sm font-medium">
                                {connection.postsPublished}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Token Expiry
                              </p>

                              <p className="mt-1 text-sm">
                                {connection.tokenExpiry}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground">
                                Actions
                              </p>

                              <button
                                type="button"
                                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                              >
                                Inspect connection
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
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

        {filteredConnections.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
            <Link2 className="h-8 w-8 text-muted-foreground" />

            <h3 className="mt-3 font-semibold">
              No connections found
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filteredConnections.map((connection) => {
          const expanded =
            expandedId === connection.id;

          return (
            <div
              key={connection.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <PlatformBadge
                      platform={connection.platform}
                    />

                    <p className="mt-3 font-medium">
                      {connection.business}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {connection.owner}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expanded ? null : connection.id,
                      )
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
                  <StatusBadge
                    status={connection.status}
                  />

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {connection.lastSync}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Account
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {connection.accountName}
                    </p>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {connection.accountId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Token
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {connection.tokenStatus}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {connection.tokenExpiry}
                    </p>
                  </div>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-border bg-muted/20 p-4">
                  <div className="grid gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Connection ID:
                      </span>{" "}
                      {connection.id}
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Connected:
                      </span>{" "}
                      {connection.connectedAt}
                    </div>

                    <div>
                      <span className="text-muted-foreground">
                        Posts published:
                      </span>{" "}
                      {connection.postsPublished}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                  >
                    Inspect connection
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredConnections.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <Link2 className="mx-auto h-8 w-8 text-muted-foreground" />

            <h3 className="mt-3 font-semibold">
              No connections found
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* Platform summary */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />

          <div>
            <h2 className="font-semibold">
              Platform integration summary
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current connection distribution across supported
              social platforms.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              "Instagram",
              "Facebook",
              "LinkedIn",
              "X",
            ] as Platform[]
          ).map((item) => {
            const count = connections.filter(
              (connection) =>
                connection.platform === item,
            ).length;

            return (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border border-border p-4"
              >
                <PlatformBadge platform={item} />

                <span className="text-sm font-semibold">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mock data notice */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

          <div>
            <p className="text-sm font-medium">
              Connection monitor is currently using mock data.
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              During Admin API Integration, this page will receive
              real OAuth connection status, token health, sync
              timestamps, connected accounts, and platform
              integration events from the backend.
            </p>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredConnections.length}
          </span>{" "}
          connections
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
