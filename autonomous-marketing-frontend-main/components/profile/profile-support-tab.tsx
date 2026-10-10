"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Headphones,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Ticket,
  X,
  XCircle,
} from "lucide-react";
import {
  createSupportTicket,
  getTicketDetails,
  getUserSupportTickets,
  replyToTicket,
  type SupportTicket,
  type TicketCategory,
  type TicketDetail,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/support";

const CATEGORIES: TicketCategory[] = [
  "Technical",
  "Connections",
  "Billing",
  "Campaigns",
  "AI Generation",
  "General",
];

const PRIORITIES: { value: TicketPriority; label: string; desc: string }[] = [
  { value: "low", label: "Low", desc: "General inquiry or non-blocking feedback" },
  { value: "medium", label: "Medium", desc: "Feature issue with workaround available" },
  { value: "high", label: "High", desc: "Major feature or campaign publishing degraded" },
  { value: "critical", label: "Critical", desc: "Complete system stoppage or urgent blocking issue" },
];

export function ProfileSupportTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create ticket modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSubject, setCreateSubject] = useState("");
  const [createCategory, setCreateCategory] = useState<TicketCategory>("Technical");
  const [createPriority, setCreatePriority] = useState<TicketPriority>("medium");
  const [createDescription, setCreateDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // View ticket details drawer / modal
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const fetchTickets = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getUserSupportTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load support tickets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicketDetails = async (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setDetailLoading(true);
    setReplyError(null);
    try {
      const detail = await getTicketDetails(ticketId);
      setTicketDetail(detail);
    } catch (err: any) {
      setReplyError(err?.message || "Failed to load ticket details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSubject.trim() || !createDescription.trim()) {
      setCreateError("Please provide both a subject and a description.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createSupportTicket({
        subject: createSubject.trim(),
        category: createCategory,
        priority: createPriority,
        message: createDescription.trim(),
        description: createDescription.trim(),
      });
      setCreateSuccess(true);
      setCreateSubject("");
      setCreateDescription("");
      setCreateCategory("Technical");
      setCreatePriority("medium");
      setTimeout(() => {
        setCreateSuccess(false);
        setIsCreateOpen(false);
      }, 1500);
      fetchTickets();
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create support ticket.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;
    setReplyLoading(true);
    setReplyError(null);
    try {
      await replyToTicket(selectedTicketId, replyText.trim());
      const freshDetail = await getTicketDetails(selectedTicketId);
      setTicketDetail(freshDetail);
      setReplyText("");
    } catch (err: any) {
      setReplyError(err?.message || "Failed to post reply.");
    } finally {
      setReplyLoading(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchSub = t.subject.toLowerCase().includes(query);
      const matchId = String(t.id).includes(query);
      return matchSub || matchId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Help & Support Desk</h2>
          <p className="text-xs text-muted-foreground">
            Submit inquiries, track existing tickets, and get assistance from our team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="ui-button-secondary inline-flex h-9 items-center gap-2 border border-border px-3.5 text-xs font-semibold transition"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Sync
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="ui-button-primary inline-flex h-9 items-center gap-2 px-4 text-xs font-semibold transition"
          >
            <Plus size={15} />
            Raise New Ticket
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Support Direct Contact Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
            <Headphones size={15} className="text-blue-600" />
            Direct Support Email
          </div>
          <p className="mt-1 text-xs text-neutral-600">support@autonomousmarketing.com</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Average response time: &lt; 2 hours</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
            <Clock3 size={15} className="text-emerald-600" />
            Support Hours
          </div>
          <p className="mt-1 text-xs text-neutral-600">Monday – Saturday: 9 AM to 7 PM IST</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Critical tickets handled 24/7</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
            <LifeBuoy size={15} className="text-purple-600" />
            System Status
          </div>
          <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={13} />
            All Systems Operational
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">AI Agents & API pipelines 100% online</p>
        </div>
      </div>

      {/* Tickets Management Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-neutral-900" />
            <h3 className="text-sm font-bold text-foreground">Your Tickets History</h3>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
              {filteredTickets.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-44 rounded-lg border border-border pl-8 pr-3 text-xs focus:border-neutral-950 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-border px-2.5 text-xs text-neutral-700 focus:border-neutral-950 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="animate-spin text-neutral-400" size={24} />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <MessageSquare className="mx-auto text-neutral-300" size={32} />
            <p className="mt-2 text-xs font-semibold text-neutral-700">No support tickets found</p>
            <p className="text-[11px] text-neutral-400">
              Have a question or encounter an issue? Click "Raise New Ticket" above.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-neutral-100">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => openTicketDetails(t.id)}
                className="flex cursor-pointer flex-col gap-2 py-3.5 transition hover:bg-neutral-50/80 sm:flex-row sm:items-center sm:justify-between px-2 rounded-xl"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">#{t.id}</span>
                    <p className="text-xs font-bold text-neutral-900 hover:text-blue-600 transition">
                      {t.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>Category: {t.category}</span>
                    <span>•</span>
                    <span>Priority: {t.priority.toUpperCase()}</span>
                    <span>•</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      t.status === "open"
                        ? "bg-amber-100 text-amber-800"
                        : t.status === "in-progress" || (t.status as string) === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : t.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {t.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400">View &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="text-neutral-900" size={18} />
                <h3 className="text-base font-bold text-foreground">Submit Support Ticket</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X size={18} />
              </button>
            </div>

            {createSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto text-emerald-600" size={40} />
                <p className="mt-3 text-sm font-bold text-foreground">Ticket Created Successfully!</p>
                <p className="mt-1 text-xs text-muted-foreground">Our engineering team has received your ticket.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
                {createError && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-700">Subject / Summary</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of the issue"
                    value={createSubject}
                    onChange={(e) => setCreateSubject(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-border px-3 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700">Category</label>
                    <select
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value as TicketCategory)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-border px-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700">Priority</label>
                    <select
                      value={createPriority}
                      onChange={(e) => setCreatePriority(e.target.value as TicketPriority)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-border px-2.5 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700">Issue Details</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Explain what happened, expected behavior, or steps to reproduce..."
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border p-3 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="ui-button-secondary h-9 border border-border px-4 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="ui-button-primary h-9 px-5 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    {createLoading && <Loader2 className="animate-spin" size={13} />}
                    Submit Ticket
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TICKET DETAILS MODAL */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-muted-foreground">#{selectedTicketId}</span>
                <h3 className="text-base font-bold text-foreground">
                  {ticketDetail?.subject || "Ticket Details"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedTicketId(null);
                  setTicketDetail(null);
                }}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="animate-spin text-neutral-400" size={28} />
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Messages conversation */}
                <div className="flex-1 space-y-3 overflow-y-auto py-4">
                  {/* Original description message */}
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Original Request • {ticketDetail?.created_at ? new Date(ticketDetail.created_at).toLocaleString() : ""}
                    </p>
                    <p className="mt-1 text-xs text-neutral-800 whitespace-pre-wrap">
                      {ticketDetail?.subject}
                    </p>
                  </div>

                  {ticketDetail?.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl p-3.5 text-xs ${
                        m.sender_type === "user"
                          ? "border border-border bg-card ml-6"
                          : "border border-blue-100 bg-blue-50/50 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span className="font-bold text-neutral-800">
                          {m.sender_type === "user" ? "You" : "Support Team"}
                        </span>
                        <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-neutral-800 whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                <div className="border-t border-neutral-100 pt-3">
                  {replyError && (
                    <div className="mb-2 rounded-lg bg-red-50 p-2 text-[11px] text-red-700">
                      {replyError}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type your reply to support..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                      className="h-10 flex-1 rounded-xl border border-border px-3 text-xs text-neutral-900 focus:border-neutral-950 focus:outline-none"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={replyLoading || !replyText.trim()}
                      className="ui-button-primary inline-flex h-10 items-center justify-center gap-1.5 px-4 text-xs font-semibold transition disabled:opacity-50"
                    >
                      {replyLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
