"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
  AlertCircle,
  Star,
} from "lucide-react";

import { apiRequest } from "@/lib/api/client";

interface SubscriptionPlan {
  id: number;
  plan_code: string;
  name: string;
  description: string | null;
  price: number;
  price_usd?: number | null;
  currency: string;
  billing_interval: string;
  max_brands: number;
  max_campaigns_per_month: number;
  features: { bullets?: string[]; [key: string]: any } | null;
  is_popular?: boolean;
  badge_text?: string | null;
  is_active: boolean;
}

interface AdminSubscriber {
  id: string;
  tenant_id: string;
  business_name: string;
  plan_name: string;
  plan_code: string;
  amount: number;
  currency: string;
  billing_interval: string;
  status: string;
  provider: string;
  started: string;
  renewal: string;
}

interface AdminSubscriptionsResponse {
  summary: {
    mrr: number;
    active_count: number;
    trial_count: number;
    past_due_count: number;
    total_subscribers: number;
  };
  subscriptions: AdminSubscriber[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<"plans" | "customers">("plans");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Plans data
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // Edit Plan modal state
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete confirmation state
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);

  // New Plan form state
  const [newPlan, setNewPlan] = useState({
    name: "",
    plan_code: "",
    description: "",
    price: 999,
    price_usd: 9.99,
    currency: "INR",
    billing_interval: "monthly",
    max_brands: 3,
    max_campaigns_per_month: 30,
    features: "150 AI Posts / mo, Multi-platform Auto Publishing, Brand Voice Tuning",
    is_popular: false,
    badge_text: "",
    is_active: true,
  });

  // Edit Plan form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: 0,
    price_usd: 0,
    currency: "INR",
    billing_interval: "monthly",
    max_brands: 1,
    max_campaigns_per_month: 5,
    features: "",
    is_popular: false,
    badge_text: "",
    is_active: true,
  });

  // Customers data
  const [customersData, setCustomersData] = useState<AdminSubscriptionsResponse>({
    summary: { mrr: 0, active_count: 0, trial_count: 0, past_due_count: 0, total_subscribers: 0 },
    subscriptions: [],
  });

  // Search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadAllData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const [plansRes, subsRes] = await Promise.all([
        apiRequest<SubscriptionPlan[]>("/payments/plans?include_inactive=true"),
        apiRequest<AdminSubscriptionsResponse>("/payments/admin/subscriptions").catch(() => ({
          summary: { mrr: 0, active_count: 0, trial_count: 0, past_due_count: 0, total_subscribers: 0 },
          subscriptions: [],
        })),
      ]);

      setPlans(Array.isArray(plansRes) ? plansRes : []);
      if (subsRes && subsRes.summary) {
        setCustomersData(subsRes);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load admin subscription data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name.trim() || !newPlan.plan_code.trim()) {
      setError("Plan name and plan code are required.");
      return;
    }

    setSubmittingPlan(true);
    setError(null);
    try {
      const featureArray = newPlan.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      await apiRequest("/payments/plans", {
        method: "POST",
        body: JSON.stringify({
          ...newPlan,
          price: Number(newPlan.price),
          price_usd: Number(newPlan.price_usd),
          max_brands: Number(newPlan.max_brands),
          max_campaigns_per_month: Number(newPlan.max_campaigns_per_month),
          features: { bullets: featureArray },
          badge_text: newPlan.badge_text.trim() || (newPlan.is_popular ? "Most Popular" : null),
        }),
      });

      setSuccessMsg(`Plan "${newPlan.name}" created successfully! It is now live on the Landing Page.`);
      setShowCreateModal(false);
      // Reset form
      setNewPlan({
        name: "",
        plan_code: "",
        description: "",
        price: 999,
        price_usd: 9.99,
        currency: "INR",
        billing_interval: "monthly",
        max_brands: 3,
        max_campaigns_per_month: 30,
        features: "150 AI Posts / mo, Multi-platform Auto Publishing, Brand Voice Tuning",
        is_popular: false,
        badge_text: "",
        is_active: true,
      });
      await loadAllData();
    } catch (err: any) {
      setError(err?.message || "Failed to create subscription plan.");
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleOpenEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    let bulletsStr = "";
    if (plan.features?.bullets && Array.isArray(plan.features.bullets)) {
      bulletsStr = plan.features.bullets.join(", ");
    } else if (Array.isArray(plan.features)) {
      bulletsStr = plan.features.join(", ");
    }

    setEditForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      price_usd: plan.price_usd !== null && plan.price_usd !== undefined ? plan.price_usd : Number((plan.price / 85).toFixed(2)),
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      max_brands: plan.max_brands,
      max_campaigns_per_month: plan.max_campaigns_per_month,
      features: bulletsStr,
      is_popular: Boolean(plan.is_popular),
      badge_text: plan.badge_text || "",
      is_active: plan.is_active,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setSubmittingEdit(true);
    setError(null);
    try {
      const featureArray = editForm.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      await apiRequest(`/payments/plans/${editingPlan.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: Number(editForm.price),
          price_usd: Number(editForm.price_usd),
          currency: editForm.currency,
          billing_interval: editForm.billing_interval,
          max_brands: Number(editForm.max_brands),
          max_campaigns_per_month: Number(editForm.max_campaigns_per_month),
          features: { bullets: featureArray },
          is_popular: editForm.is_popular,
          badge_text: editForm.badge_text.trim() || (editForm.is_popular ? "Most Popular" : null),
          is_active: editForm.is_active,
        }),
      });

      setSuccessMsg(`Plan "${editForm.name}" updated successfully! Landing Page reflects changes immediately.`);
      setEditingPlan(null);
      await loadAllData();
    } catch (err: any) {
      setError(err?.message || "Failed to update plan.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleTogglePlanStatus = async (plan: SubscriptionPlan) => {
    try {
      await apiRequest(`/payments/plans/${plan.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      setSuccessMsg(`Plan "${plan.name}" status updated to ${!plan.is_active ? "Active" : "Inactive"}.`);
      await loadAllData();
    } catch (err: any) {
      setError(err?.message || "Failed to update plan status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setDeletingPlan(true);
    try {
      await apiRequest(`/payments/plans/${planToDelete.id}`, {
        method: "DELETE",
      });
      setSuccessMsg(`Plan "${planToDelete.name}" removed successfully. It has been removed from the Landing Page.`);
      setPlanToDelete(null);
      await loadAllData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete plan.");
    } finally {
      setDeletingPlan(false);
    }
  };

  const filteredSubscriptions = useMemo(() => {
    return customersData.subscriptions.filter((sub) => {
      const q = search.toLowerCase();
      const matchesSearch =
        sub.business_name.toLowerCase().includes(q) ||
        sub.tenant_id.toLowerCase().includes(q) ||
        sub.plan_name.toLowerCase().includes(q) ||
        sub.id.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customersData.subscriptions, search, statusFilter]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Billing
            <span>/</span>
            Subscriptions
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Subscription & Plans Management
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create pricing tiers, set quotas, and manage real-time plans displayed on the Landing Page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className="ui-button-secondary inline-flex items-center gap-2 border border-border px-3.5 py-2 text-sm font-medium transition"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="ui-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Create Plan
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Monthly Recurring Revenue</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight">
            {formatCurrency(customersData.summary.mrr)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Calculated from active paid plans</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active Subscribers</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight">
            {customersData.summary.active_count}
          </p>
          <p className="mt-1 text-xs text-emerald-500">Live active workspaces</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Trial Users</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight">
            {customersData.summary.trial_count}
          </p>
          <p className="mt-1 text-xs text-blue-500">3-Day ₹2 Mandate trials</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Configured Plans</span>
            <Layers className="h-4 w-4" />
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight">{plans.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {plans.filter((p) => p.is_active).length} live on Landing Page
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition ${
            activeTab === "plans"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          Subscription Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition ${
            activeTab === "customers"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Subscribed Customers ({customersData.subscriptions.length})
        </button>
      </div>

      {/* TAB 1: SUBSCRIPTION PLANS MANAGEMENT */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              These plans are synced in real time with the Landing Page. Any plan created or edited here is instantly live.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5">Plan Name</th>
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-5 py-3.5">Price (INR)</th>
                    <th className="px-5 py-3.5">Price (USD)</th>
                    <th className="px-5 py-3.5">Popular Tag</th>
                    <th className="px-5 py-3.5">Quotas (Brands / Campaigns)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No subscription plans found. Click "+ Create Plan" to add the first plan.
                      </td>
                    </tr>
                  ) : (
                    plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-muted/20 transition">
                        <td className="px-5 py-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{plan.name}</span>
                            {plan.is_popular && (
                              <span className="flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                <Star className="h-3 w-3 fill-current" />
                                {plan.badge_text || "Popular"}
                              </span>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-xs font-normal text-muted-foreground line-clamp-1 mt-0.5">
                              {plan.description}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                          {plan.plan_code}
                        </td>
                        <td className="px-5 py-4 font-bold text-foreground">
                          {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">
                          {plan.price === 0 ? "$0" : `$${plan.price_usd || (plan.price / 85).toFixed(2)}`}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {plan.badge_text ? (
                            <span className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">
                              {plan.badge_text}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-foreground">
                          <span className="font-semibold">{plan.max_brands}</span> brands ·{" "}
                          <span className="font-semibold">{plan.max_campaigns_per_month}</span> campaigns/mo
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              plan.is_active
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-neutral-500/10 text-muted-foreground"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                plan.is_active ? "bg-emerald-500" : "bg-neutral-400"
                              }`}
                            />
                            {plan.is_active ? "Live" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(plan)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                              title="Edit Plan"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleTogglePlanStatus(plan)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                                plan.is_active
                                  ? "border-border hover:bg-muted text-muted-foreground"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                              }`}
                            >
                              {plan.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => setPlanToDelete(plan)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition"
                              title="Delete Plan"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIBED CUSTOMERS */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by business name, tenant ID, plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              {["All", "Active", "Trial", "Past_due"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === status
                      ? "bg-foreground text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Workspace / Tenant</th>
                    <th className="px-5 py-3.5">Plan</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Started</th>
                    <th className="px-5 py-3.5">Renewal / Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No customer subscriptions found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/20 transition">
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                          {sub.id}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground">{sub.business_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{sub.tenant_id}</p>
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">
                          {sub.plan_name}
                        </td>
                        <td className="px-5 py-4 font-bold text-foreground">
                          ₹{sub.amount?.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              sub.status.toLowerCase() === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : sub.status.toLowerCase() === "trial"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{sub.started}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{sub.renewal}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Create Subscription Plan</h3>
                <p className="text-xs text-muted-foreground">
                  New plan will be instantly live on the Landing Page and user dashboard.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">Plan Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pro Marketer"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Unique Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pro_monthly"
                    value={newPlan.plan_code}
                    onChange={(e) => setNewPlan({ ...newPlan, plan_code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Price ($ USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newPlan.price_usd}
                    onChange={(e) => setNewPlan({ ...newPlan, price_usd: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Billing Interval</label>
                  <select
                    value={newPlan.billing_interval}
                    onChange={(e) => setNewPlan({ ...newPlan, billing_interval: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">Highlight as Most Popular</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="create_is_popular"
                      checked={newPlan.is_popular}
                      onChange={(e) => setNewPlan({ ...newPlan, is_popular: e.target.checked })}
                      className="h-4 w-4 rounded border-border"
                    />
                    <label htmlFor="create_is_popular" className="text-xs text-foreground cursor-pointer">
                      Show vibrant purple card on Landing Page
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Badge Text (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Most Popular, Best Value"
                    value={newPlan.badge_text}
                    onChange={(e) => setNewPlan({ ...newPlan, badge_text: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">Max Brands Allowed</label>
                  <input
                    type="number"
                    min={1}
                    value={newPlan.max_brands}
                    onChange={(e) => setNewPlan({ ...newPlan, max_brands: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Monthly Campaigns Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={newPlan.max_campaigns_per_month}
                    onChange={(e) => setNewPlan({ ...newPlan, max_campaigns_per_month: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short description of this plan"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Features List (comma-separated bullets)
                </label>
                <textarea
                  rows={3}
                  placeholder="150 AI Posts / mo, Multi-platform Auto Publishing, Priority Support"
                  value={newPlan.features}
                  onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_toggle"
                    checked={newPlan.is_active}
                    onChange={(e) => setNewPlan({ ...newPlan, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="is_active_toggle" className="text-xs font-medium text-foreground cursor-pointer">
                    Publish Live on Landing Page immediately
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="ui-button-secondary border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="ui-button-primary inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
                >
                  {submittingPlan ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save & Publish Plan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Edit Subscription Plan</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Code: {editingPlan.plan_code}
                </p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Price ($ USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.price_usd}
                    onChange={(e) => setEditForm({ ...editForm, price_usd: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Billing Interval</label>
                  <select
                    value={editForm.billing_interval}
                    onChange={(e) => setEditForm({ ...editForm, billing_interval: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">Highlight as Most Popular</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="edit_is_popular"
                      checked={editForm.is_popular}
                      onChange={(e) => setEditForm({ ...editForm, is_popular: e.target.checked })}
                      className="h-4 w-4 rounded border-border"
                    />
                    <label htmlFor="edit_is_popular" className="text-xs text-foreground cursor-pointer">
                      Show vibrant purple card on Landing Page
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Badge Text (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Most Popular, Best Value"
                    value={editForm.badge_text}
                    onChange={(e) => setEditForm({ ...editForm, badge_text: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-foreground">Max Brands Allowed</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.max_brands}
                    onChange={(e) => setEditForm({ ...editForm, max_brands: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Monthly Campaigns Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.max_campaigns_per_month}
                    onChange={(e) => setEditForm({ ...editForm, max_campaigns_per_month: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short description of this plan"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Features List (comma-separated bullets)
                </label>
                <textarea
                  rows={3}
                  value={editForm.features}
                  onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit_is_active_toggle"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="edit_is_active_toggle" className="text-xs font-medium text-foreground cursor-pointer">
                  Plan is Active (visible to users on Landing Page)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="ui-button-secondary border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="ui-button-primary inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
                >
                  {submittingEdit ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="rounded-full bg-red-500/10 p-2.5">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Subscription Plan?</h3>
                <p className="text-xs text-muted-foreground">Action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">&ldquo;{planToDelete.name}&rdquo;</strong> ({planToDelete.plan_code})?
              This plan will be <strong>immediately removed from the Landing Page</strong> and will no longer be available for subscription.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                disabled={deletingPlan}
                className="ui-button-secondary border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingPlan}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow-sm"
              >
                {deletingPlan ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
