"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Headphones,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Send,
  Tag,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminUpdateTicket, getTicketDetails } from "@/lib/api/support";

type TicketStatus =
  | "open"
  | "pending"
  | "in-progress"
  | "resolved"
  | "closed";

type TicketPriority = "low" | "normal" | "high" | "critical";

const ticket = {
  id: "SUP-1048",
  subject: "Instagram connection stopped syncing",
  customer: "Priya Sharma",
  email: "priya@urbanstudio.in",
  business: "Urban Studio",
  category: "Connections",
  priority: "high" as TicketPriority,
  status: "open" as TicketStatus,
  assignedTo: "Arjun Mehta",
  createdAt: "Sep 10, 2026 · 09:14",
  updatedAt: "12 min ago",
  accountId: "BUS-1024",
};

const messages = [
  {
    id: 1,
    author: "Priya Sharma",
    role: "Customer",
    time: "09:14",
    message:
      "Hi, our Instagram connection appears to have stopped syncing. The campaign dashboard shows the account as connected, but new posts are not being published.",
    customer: true,
  },
  {
    id: 2,
    author: "Arjun Mehta",
    role: "Support Admin",
    time: "09:27",
    message:
      "Thanks for reporting this. I am checking the connection status and the latest synchronization attempt now.",
    customer: false,
  },
  {
    id: 3,
    author: "Priya Sharma",
    role: "Customer",
    time: "09:31",
    message:
      "Thank you. The last successful post was yesterday afternoon. Everything was working normally before that.",
    customer: true,
  },
  {
    id: 4,
    author: "Arjun Mehta",
    role: "Support Admin",
    time: "09:42",
    message:
      "I can see that the connection is still present, but the latest sync attempt returned an authentication warning. I am going to review the connection details and determine whether a reconnect is required.",
    customer: false,
  },
];

const activity = [
  {
    title: "Ticket created",
    description: "Customer submitted a new support request.",
    time: "09:14",
  },
  {
    title: "Assigned to Arjun Mehta",
    description: "Ticket assigned to the support team.",
    time: "09:18",
  },
  {
    title: "Priority changed to High",
    description: "Priority raised after connection issue was identified.",
    time: "09:23",
  },
  {
    title: "Admin replied",
    description: "Support administrator responded to the customer.",
    time: "09:27",
  },
];

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function AdminSupportTicketPage() {
  const params = useParams();
  const ticketIdParam = (params?.id as string) || ticket.id;

  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [messageList, setMessageList] = useState(messages);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    async function loadLiveTicket() {
      try {
        const detail = await getTicketDetails(ticketIdParam);
        if (detail) {
          const mappedStatus = (
            detail.status.toLowerCase() === "in-progress"
              ? "in-progress"
              : detail.status.toLowerCase() === "pending"
                ? "pending"
                : detail.status.toLowerCase() === "resolved"
                  ? "resolved"
                  : detail.status.toLowerCase() === "closed"
                    ? "closed"
                    : "open"
          ) as TicketStatus;

          const mappedPriority = (
            detail.priority.toLowerCase() === "critical"
              ? "critical"
              : detail.priority.toLowerCase() === "high"
                ? "high"
                : detail.priority.toLowerCase() === "low"
                  ? "low"
                  : "normal"
          ) as TicketPriority;

          setCurrentTicket({
            id: detail.ticket_number,
            subject: detail.subject,
            customer: (detail as any).customer || "Customer",
            email: (detail as any).email || "user@workspace.local",
            business: (detail as any).business || "Workspace",
            category: (detail.category as any) || "Technical",
            priority: mappedPriority,
            status: mappedStatus,
            assignedTo: "Support Ops",
            createdAt: new Date(detail.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            updatedAt: detail.updated_at
              ? new Date(detail.updated_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now",
            accountId: "BUS-1024",
          });

          setStatus(mappedStatus);
          setPriority(mappedPriority);

          if (detail.messages && detail.messages.length > 0) {
            setMessageList(
              detail.messages.map((m) => ({
                id: m.id,
                author:
                  m.sender_type === "admin"
                    ? "Support Specialist"
                    : m.sender_email || "Customer",
                role: m.sender_type === "admin" ? "Support Admin" : "Customer",
                time: new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                message: m.message,
                customer: m.sender_type !== "admin",
              })),
            );
          }
        }
      } catch {
        // Retain fallback data if lookup fails
      }
    }
    loadLiveTicket();
  }, [ticketIdParam]);

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    setStatus(newStatus);
    try {
      await adminUpdateTicket(ticketIdParam, { status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePriority = async (newPriority: TicketPriority) => {
    setPriority(newPriority);
    try {
      await adminUpdateTicket(ticketIdParam, { priority: newPriority });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendAdminReply = async () => {
    if (!reply.trim()) return;
    setSubmittingReply(true);
    try {
      await adminUpdateTicket(ticketIdParam, { admin_reply: reply.trim() });
      setMessageList((prev) => [
        ...prev,
        {
          id: Date.now(),
          author: "Support Specialist",
          role: "Support Admin",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          message: reply.trim(),
          customer: false,
        },
      ]);
      setReply("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReply(false);
    }
  };

  const statusLabel =
    statusOptions.find((item) => item.value === status)?.label ?? "Open";

  const priorityLabel =
    priorityOptions.find((item) => item.value === priority)?.label ?? "High";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Back */}
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Link>

        {/* Header */}
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold">
                    {currentTicket.id}
                  </span>

                  <StatusBadge status={status} />

                  <PriorityBadge priority={priority} />
                </div>

                <h1 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
                  {currentTicket.subject}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Created {currentTicket.createdAt} · Last updated {currentTicket.updatedAt}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {status !== "resolved" && status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("resolved")}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Resolve
                  </button>
                )}

                {status === "resolved" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("open")}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3.5 text-sm font-medium transition hover:bg-muted"
                  >
                    Reopen
                  </button>
                )}

                {status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("closed")}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3.5 text-sm font-medium transition hover:bg-muted"
                  >
                    <XCircle className="h-4 w-4" />
                    Close
                  </button>
                )}

                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="More ticket actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status controls */}
          <div className="grid border-t border-border sm:grid-cols-3">
            <SelectControl
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as TicketStatus)}
              options={statusOptions}
            />

            <SelectControl
              label="Priority"
              value={priority}
              onChange={(value) => setPriority(value as TicketPriority)}
              options={priorityOptions}
            />

            <SelectControl
              label="Assigned to"
              value={assignedTo}
              onChange={setAssignedTo}
              options={[
                { value: "Arjun Mehta", label: "Arjun Mehta" },
                { value: "Aisha Khan", label: "Aisha Khan" },
                { value: "Unassigned", label: "Unassigned" },
              ]}
            />
          </div>
        </section>

        {/* Mock notice */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />

          <div>
            <p className="text-sm font-medium">Support ticket preview</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Ticket actions and conversation data are currently local mock
              state. Backend persistence, email notifications, assignment
              updates, and real-time messaging will be connected during Admin
              API Integration.
            </p>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
          {/* Conversation */}
          <section className="min-w-0 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
              <div>
                <h2 className="font-semibold">Conversation</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Customer and support communication
                </p>
              </div>

              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {messageList.length} messages
              </span>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {messageList.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.customer ? "" : "flex-row-reverse"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      message.customer
                        ? "bg-muted"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {message.customer ? (
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Headphones className="h-4 w-4" />
                    )}
                  </div>

                  <div
                    className={`min-w-0 max-w-[88%] sm:max-w-[75%] ${
                      message.customer ? "" : "text-right"
                    }`}
                  >
                    <div
                      className={`mb-1 flex flex-wrap items-center gap-2 text-xs ${
                        message.customer ? "" : "justify-end"
                      }`}
                    >
                      <span className="font-semibold">
                        {message.author}
                      </span>

                      <span className="text-muted-foreground">
                        {message.role}
                      </span>

                      <span className="text-muted-foreground">
                        · {message.time}
                      </span>
                    </div>

                    <div
                      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                        message.customer
                          ? "border-border bg-muted/40"
                          : "border-primary/20 bg-primary/5"
                      }`}
                    >
                      {message.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply composer */}
            <div className="border-t border-border p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Reply to customer</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Send a response to {currentTicket.customer}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNote(!showNote)}
                  className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  {showNote ? "Hide internal note" : "Add internal note"}
                </button>
              </div>

              {showNote ? (
                <div className="space-y-3">
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Write an internal note visible only to admins..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setNote("")}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white transition hover:bg-amber-600"
                    >
                      <Edit3 className="h-4 w-4" />
                      Save Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Write your response..."
                    rows={5}
                    className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <Paperclip className="h-4 w-4" />
                      Attach
                    </button>

                    <button
                      type="button"
                      onClick={handleSendAdminReply}
                      disabled={submittingReply || !reply.trim()}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {submittingReply ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Customer */}
            <section className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-4">
                <h2 className="font-semibold">Customer</h2>
              </div>

              <div className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {currentTicket.customer}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                      {currentTicket.business}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={currentTicket.email}
                  />

                  <InfoRow
                    icon={Tag}
                    label="Business ID"
                    value={currentTicket.accountId}
                  />
                </div>

                <button
                  type="button"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  View Customer
                </button>
              </div>
            </section>

            {/* Ticket details */}
            <section className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-4">
                <h2 className="font-semibold">Ticket Details</h2>
              </div>

              <div className="divide-y divide-border">
                <DetailRow label="Ticket ID" value={currentTicket.id} />

                <DetailRow label="Category" value={currentTicket.category} />

                <DetailRow label="Status" value={statusLabel} />

                <DetailRow label="Priority" value={priorityLabel} />

                <DetailRow label="Created" value={currentTicket.createdAt} />

                <DetailRow label="Updated" value={currentTicket.updatedAt} />
              </div>
            </section>

            {/* Activity */}
            <section className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-4">
                <h2 className="font-semibold">Activity</h2>
              </div>

              <div className="p-4">
                <div className="space-y-5">
                  {activity.map((item, index) => (
                    <div key={item.title} className="relative flex gap-3">
                      {index < activity.length - 1 && (
                        <div className="absolute left-[7px] top-4 h-[calc(100%+12px)] w-px bg-border" />
                      )}

                      <div className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-background bg-primary ring-1 ring-primary/30" />

                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </p>

                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SLA */}
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold">Response SLA</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    First response target
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-semibold">18 min</p>
                  <p className="text-xs text-muted-foreground">
                    remaining
                  </p>
                </div>

                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  On track
                </span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<
    TicketStatus,
    { label: string; className: string; icon: typeof CheckCircle2 }
  > = {
    open: {
      label: "Open",
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
      icon: MessageSquare,
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
      className: "bg-muted text-muted-foreground ring-border",
      icon: XCircle,
    },
  };

  const item = config[status];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${item.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config: Record<TicketPriority, { label: string; className: string }> =
    {
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

  const item = config[priority];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${item.className}`}>
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
      {item.label}
    </span>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="border-b border-border p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <label className="mb-2 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-8 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 break-all text-sm">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
