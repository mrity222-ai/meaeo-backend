"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Headphones,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Ticket,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminGetAllTickets } from "@/lib/api/support";

type TicketStatus =
  | "open"
  | "pending"
  | "in-progress"
  | "resolved"
  | "closed";

type TicketPriority = "low" | "normal" | "high" | "critical";

type TicketCategory =
  | "Technical"
  | "Billing"
  | "Account"
  | "Campaign"
  | "Connections"
  | "AI";

type SupportTicket = {
  id: string;
  subject: string;
  customer: string;
  email: string;
  business: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string;
  messages: number;
  createdAt: string;
  updatedAt: string;
};



const statusConfig: Record<
  TicketStatus,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  open: {
    label: "Open",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
    icon: Ticket,
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
    icon: Clock3,
  },
  "in-progress": {
    label: "In Progress",
    className:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20",
    icon: Headphones,
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
    icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    className:
      "bg-muted text-muted-foreground ring-border",
    icon: XCircle,
  },
};

const priorityConfig: Record<
  TicketPriority,
  {
    label: string;
    className: string;
  }
> = {
  low: {
    label: "Low",
    className: "text-muted-foreground",
  },
  normal: {
    label: "Normal",
    className: "text-blue-600 dark:text-blue-400",
  },
  high: {
    label: "High",
    className: "text-orange-600 dark:text-orange-400",
  },
  critical: {
    label: "Critical",
    className: "text-red-600 dark:text-red-400",
  },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = priorityConfig[priority];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          priority === "critical"
            ? "bg-red-500"
            : priority === "high"
              ? "bg-orange-500"
              : priority === "normal"
                ? "bg-blue-500"
                : "bg-muted-foreground"
        }`}
      />
      {config.label}
    </span>
  );
}

export default function AdminSupportPage() {
  const [allTickets, setAllTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | TicketPriority
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | TicketCategory
  >("all");

  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      const data = await adminGetAllTickets();
      if (data) {
        const liveMapped: SupportTicket[] = data.map((t) => ({
          id: t.ticket_number,
          subject: t.subject,
          customer: t.customer || (t.user_email ? t.user_email.split("@")[0].toUpperCase() : "Customer"),
          email: t.user_email || "user@workspace.local",
          business: (t as any).business || "Workspace",
          category: (t.category as TicketCategory) || "Technical",
          priority: (t.priority === "critical" ? "critical" : t.priority === "high" ? "high" : t.priority === "low" ? "low" : "normal") as TicketPriority,
          status: (t.status === "in-progress" ? "in-progress" : t.status === "pending" ? "pending" : t.status === "resolved" ? "resolved" : t.status === "closed" ? "closed" : "open") as TicketStatus,
          assignedTo: "Support Ops",
          messages: t.messages_count || 1,
          createdAt: new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          updatedAt: t.updated_at ? new Date(t.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
        }));
        setAllTickets(liveMapped);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allTickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.customer.toLowerCase().includes(query) ||
        ticket.business.toLowerCase().includes(query) ||
        ticket.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "all" || ticket.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    });
  }, [allTickets, search, statusFilter, priorityFilter, categoryFilter]);

  const stats = {
    total: allTickets.length,
    open: allTickets.filter((ticket) => ticket.status === "open").length,
    pending: allTickets.filter((ticket) => ticket.status === "pending").length,
    inProgress: allTickets.filter((ticket) => ticket.status === "in-progress")
      .length,
    critical: allTickets.filter((ticket) => ticket.priority === "critical").length,
    resolved: allTickets.filter(
      (ticket) => ticket.status === "resolved" || ticket.status === "closed",
    ).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Headphones className="h-4 w-4" />
              <span>Admin</span>
              <span>/</span>
              <span>Support</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Support Tickets
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage customer support requests and resolve issues across the platform.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTickets()}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => fetchTickets()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Live Tickets ({stats.total})
            </button>
          </div>
        </div>

        {/* Live sync notice */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

          <div>
            <p className="text-sm font-medium text-emerald-950 dark:text-emerald-200">Live Support Desk Connected</p>
            <p className="mt-0.5 text-xs leading-5 text-emerald-800/80 dark:text-emerald-300/80">
              Customer tickets raised from the user panel (/support) are synced directly with the database.
              Click on any ticket to view the conversation history and send administrative responses.
            </p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Total Tickets"
            value={stats.total}
            icon={Ticket}
          />
          <StatCard
            label="Open"
            value={stats.open}
            icon={AlertCircle}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock3}
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={Headphones}
          />
          <StatCard
            label="Critical"
            value={stats.critical}
            icon={AlertCircle}
            danger
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
          />
        </div>

        {/* Filters */}
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tickets, customers, businesses..."
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <FilterSelect
                  value={statusFilter}
                  onChange={(value) =>
                    setStatusFilter(value as "all" | TicketStatus)
                  }
                  options={[
                    ["all", "All statuses"],
                    ["open", "Open"],
                    ["pending", "Pending"],
                    ["in-progress", "In Progress"],
                    ["resolved", "Resolved"],
                    ["closed", "Closed"],
                  ]}
                />

                <FilterSelect
                  value={priorityFilter}
                  onChange={(value) =>
                    setPriorityFilter(value as "all" | TicketPriority)
                  }
                  options={[
                    ["all", "All priorities"],
                    ["critical", "Critical"],
                    ["high", "High"],
                    ["normal", "Normal"],
                    ["low", "Low"],
                  ]}
                />

                <FilterSelect
                  value={categoryFilter}
                  onChange={(value) =>
                    setCategoryFilter(value as "all" | TicketCategory)
                  }
                  options={[
                    ["all", "All categories"],
                    ["Technical", "Technical"],
                    ["Billing", "Billing"],
                    ["Account", "Account"],
                    ["Campaign", "Campaign"],
                    ["Connections", "Connections"],
                    ["AI", "AI"],
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Results header */}
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredTickets.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {allTickets.length}
              </span>{" "}
              tickets
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground transition hover:text-foreground sm:self-auto"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort by updated
            </button>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border last:border-0 transition hover:bg-muted/20"
                  >
                    <td className="px-4 py-4">
                      <div className="max-w-[330px]">
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          className="text-xs font-semibold text-muted-foreground hover:underline"
                        >
                          {ticket.id}
                        </Link>
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          className="mt-1 block truncate text-sm font-medium text-foreground hover:underline hover:text-primary"
                        >
                          {ticket.subject}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {ticket.messages} messages
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium">{ticket.customer}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {ticket.business}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {ticket.category}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                          <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="whitespace-nowrap">
                          {ticket.assignedTo}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {ticket.updatedAt}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/admin/support/${ticket.id}`}
                          aria-label={`View ${ticket.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title="Open ticket conversation"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          aria-label={`More actions for ${ticket.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border md:hidden">
            {filteredTickets.map((ticket) => (
              <article key={ticket.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="text-xs font-semibold text-muted-foreground hover:underline"
                    >
                      {ticket.id}
                    </Link>

                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="mt-1 block text-sm font-semibold leading-5 hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                  </div>

                  <StatusBadge status={ticket.status} />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{ticket.customer}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {ticket.business}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                      {ticket.category}
                    </span>
                    <PriorityBadge priority={ticket.priority} />
                    <span className="text-xs text-muted-foreground">
                      {ticket.messages} messages
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <div className="text-xs text-muted-foreground">
                      <p>{ticket.assignedTo}</p>
                      <p className="mt-1">{ticket.updatedAt}</p>
                    </div>

                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Loading support tickets...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 text-sm font-semibold">
                No tickets found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {allTickets.length === 0
                  ? "No support tickets have been created yet."
                  : "Try changing your search or filter criteria."}
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Page 1 of 1
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium transition hover:bg-muted"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Operational summary */}
        <section className="grid gap-4 lg:grid-cols-3">
          <SummaryCard
            icon={AlertCircle}
            title="Critical attention"
            value={`${stats.critical} tickets`}
            description="Critical-priority tickets require immediate review."
          />

          <SummaryCard
            icon={Clock3}
            title="Waiting for action"
            value={`${stats.pending} pending`}
            description="Tickets currently waiting for an admin response or action."
          />

          <SummaryCard
            icon={CheckCircle2}
            title="Resolved / closed"
            value={`${stats.resolved} tickets`}
            description="Tickets that have reached a completed support state."
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  danger = false,
}: {
  label: string;
  value: number;
  icon: typeof Ticket;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>

        <Icon
          className={`h-4 w-4 ${
            danger ? "text-red-500" : "text-muted-foreground"
          }`}
        />
      </div>

      <p
        className={`mt-3 text-2xl font-semibold tracking-tight ${
          danger ? "text-red-600 dark:text-red-400" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-[150px] appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>

      <Filter className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof AlertCircle;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
