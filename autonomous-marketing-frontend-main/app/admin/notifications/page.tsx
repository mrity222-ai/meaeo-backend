"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Info,
  Search,
  Settings,
  ShieldAlert,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

type NotificationType =
  | "system"
  | "security"
  | "billing"
  | "user"
  | "campaign"
  | "ai";

type NotificationPriority = "low" | "normal" | "high" | "critical";

type AdminNotification = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
};

const notifications: AdminNotification[] = [
  {
    id: "NOT-1001",
    title: "AI service recovered",
    description:
      "The content generation service is operational again after a temporary interruption.",
    type: "ai",
    priority: "high",
    timestamp: "5 minutes ago",
    read: false,
    actionLabel: "View AI status",
  },
  {
    id: "NOT-1002",
    title: "Multiple failed login attempts",
    description:
      "Several unsuccessful authentication attempts were detected from the same IP address.",
    type: "security",
    priority: "critical",
    timestamp: "18 minutes ago",
    read: false,
    actionLabel: "Review security",
  },
  {
    id: "NOT-1003",
    title: "New administrator added",
    description:
      "A new administrator account was added to the platform.",
    type: "user",
    priority: "normal",
    timestamp: "42 minutes ago",
    read: false,
  },
  {
    id: "NOT-1004",
    title: "Subscription payment failed",
    description:
      "A customer subscription payment could not be processed.",
    type: "billing",
    priority: "high",
    timestamp: "1 hour ago",
    read: true,
    actionLabel: "View payments",
  },
  {
    id: "NOT-1005",
    title: "Campaign queue growing",
    description:
      "The scheduled campaign queue is above its normal processing threshold.",
    type: "campaign",
    priority: "normal",
    timestamp: "2 hours ago",
    read: true,
  },
  {
    id: "NOT-1006",
    title: "Scheduled maintenance reminder",
    description:
      "Platform maintenance is scheduled for the upcoming maintenance window.",
    type: "system",
    priority: "low",
    timestamp: "3 hours ago",
    read: true,
  },
  {
    id: "NOT-1007",
    title: "System health check completed",
    description:
      "All monitored platform services passed their latest health checks.",
    type: "system",
    priority: "low",
    timestamp: "4 hours ago",
    read: true,
  },
  {
    id: "NOT-1008",
    title: "Campaign publishing completed",
    description:
      "The scheduled campaign batch was successfully published across connected platforms.",
    type: "campaign",
    priority: "normal",
    timestamp: "5 hours ago",
    read: true,
  },
];

const typeConfig: Record<
  NotificationType,
  {
    label: string;
    icon: typeof Bell;
  }
> = {
  system: {
    label: "System",
    icon: Settings,
  },
  security: {
    label: "Security",
    icon: ShieldAlert,
  },
  billing: {
    label: "Billing",
    icon: AlertCircle,
  },
  user: {
    label: "User",
    icon: UserPlus,
  },
  campaign: {
    label: "Campaign",
    icon: Bell,
  },
  ai: {
    label: "AI",
    icon: Info,
  },
};

const priorityConfig: Record<
  NotificationPriority,
  {
    label: string;
    className: string;
  }
> = {
  low: {
    label: "Low",
    className:
      "border-border bg-muted text-muted-foreground",
  },
  normal: {
    label: "Normal",
    className:
      "border-border bg-background text-foreground",
  },
  high: {
    label: "High",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  critical: {
    label: "Critical",
    className:
      "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  },
};

function NotificationTypeBadge({
  type,
}: {
  type: NotificationType;
}) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: NotificationPriority;
}) {
  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
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

export default function AdminNotificationsPage() {
  const [items, setItems] = useState(notifications);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [priority, setPriority] = useState("all");
  const [view, setView] = useState("all");

  const unreadCount = items.filter((item) => !item.read).length;

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query);

      const matchesType =
        type === "all" || item.type === type;

      const matchesPriority =
        priority === "all" || item.priority === priority;

      const matchesView =
        view === "all" ||
        (view === "unread" && !item.read) ||
        (view === "read" && item.read);

      return (
        matchesSearch &&
        matchesType &&
        matchesPriority &&
        matchesView
      );
    });
  }, [items, search, type, priority, view]);

  function markAsRead(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
  }

  function markAllAsRead() {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      })),
    );
  }

  function removeNotification(id: string) {
    setItems((current) =>
      current.filter((item) => item.id !== id),
    );
  }

  function clearReadNotifications() {
    setItems((current) =>
      current.filter((item) => !item.read),
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6" />

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Notifications
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor important system alerts, security events,
            billing issues, AI activity, and platform notifications.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Bell className="h-3.5 w-3.5" />
          Mock notification data
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Notifications"
          value={String(items.length)}
          description="Current notification center"
          icon={<Bell className="h-5 w-5" />}
        />

        <StatCard
          title="Unread"
          value={String(unreadCount)}
          description="Requires attention"
          icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
        />

        <StatCard
          title="Critical"
          value={String(
            items.filter(
              (item) => item.priority === "critical",
            ).length,
          )}
          description="Security-sensitive alerts"
          icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
        />

        <StatCard
          title="High Priority"
          value={String(
            items.filter(
              (item) => item.priority === "high",
            ).length,
          )}
          description="Needs administrator review"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* Notification controls */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:flex">
            {/* Search */}
            <div className="relative sm:col-span-2 xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search notifications..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-foreground/30"
              />
            </div>

            {/* View */}
            <select
              value={view}
              onChange={(event) => setView(event.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
            >
              <option value="all">All notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            {/* Type */}
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
            >
              <option value="all">All types</option>
              <option value="system">System</option>
              <option value="security">Security</option>
              <option value="billing">Billing</option>
              <option value="user">User</option>
              <option value="campaign">Campaign</option>
              <option value="ai">AI</option>
            </select>

            {/* Priority */}
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
            >
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>

            <button
              type="button"
              onClick={clearReadNotifications}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              Clear read
            </button>
          </div>
        </div>
      </div>

      {/* Notification list */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Recent notifications</h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {filteredNotifications.length} notifications shown
            </p>
          </div>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Clock3 className="h-3.5 w-3.5" />
            Latest activity
          </div>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => {
              const TypeIcon =
                typeConfig[notification.type].icon;

              return (
                <div
                  key={notification.id}
                  className={`group p-4 transition hover:bg-muted/30 sm:p-5 ${
                    !notification.read
                      ? "bg-muted/10"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        notification.priority === "critical"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : notification.priority === "high"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <TypeIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-foreground" />
                            )}

                            <h3 className="font-medium">
                              {notification.title}
                            </h3>
                          </div>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {notification.description}
                          </p>
                        </div>

                        <p className="shrink-0 text-xs text-muted-foreground">
                          {notification.timestamp}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <NotificationTypeBadge
                          type={notification.type}
                        />

                        <PriorityBadge
                          priority={notification.priority}
                        />

                        <span className="text-xs text-muted-foreground">
                          {notification.id}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {notification.actionLabel && (
                          <button
                            type="button"
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            {notification.actionLabel}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Mark as read
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            removeNotification(notification.id)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <CheckCheck className="h-10 w-10 text-muted-foreground" />

            <h3 className="mt-4 font-semibold">
              No notifications found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              There are no notifications matching your current
              search and filter settings.
            </p>
          </div>
        )}
      </div>

      {/* Notification preferences */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Settings className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Notification preferences
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure which administrative alerts should be
                delivered to platform administrators.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"
          >
            Configure alerts
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mock data notice */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

          <div>
            <p className="text-sm font-medium">
              Notification center is currently using mock data.
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              During Admin API Integration, this page will be
              connected to real system events, security alerts,
              billing events, AI failures, campaign activity, and
              administrative notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
