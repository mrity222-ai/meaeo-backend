"use client";

import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api/client";

type BusinessStatus = "Active" | "Trial" | "Suspended";
type BusinessPlan = "Free" | "Pro" | "Business";

type Business = {
  id: string;
  raw_id?: number;
  name: string;
  owner: string;
  email: string;
  category?: string;
  plan: BusinessPlan;
  status: BusinessStatus;
  campaigns: number;
  users: number;
  products: number;
  created: string;
  lastActive: string;
  tenant_id?: string;
};

const statusStyles: Record<BusinessStatus, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Suspended: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const planStyles: Record<BusinessPlan, string> = {
  Free: "bg-muted text-muted-foreground",
  Pro: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Business: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BusinessStatus>(
    "All",
  );
  const [planFilter, setPlanFilter] = useState<"All" | BusinessPlan>("All");

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    try {
      const data = await apiRequest<Business[]>("/admin/businesses");
      setBusinesses(data);
    } catch (err) {
      console.error("Failed to load businesses:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return businesses.filter((business) => {
      const matchesSearch =
        !query ||
        business.name.toLowerCase().includes(query) ||
        business.owner.toLowerCase().includes(query) ||
        business.email.toLowerCase().includes(query) ||
        business.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || business.status === statusFilter;

      const matchesPlan =
        planFilter === "All" || business.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [businesses, search, statusFilter, planFilter]);

  const activeCount = businesses.filter(
    (business) => business.status === "Active",
  ).length;

  const trialCount = businesses.filter(
    (business) => business.status === "Trial",
  ).length;

  const totalUsers = businesses.reduce(
    (total, business) => total + business.users,
    0,
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/admin/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Admin
            </Link>
            <span>/</span>
            <span>Businesses</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Business Management
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage businesses, accounts, plans, and business data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadBusinesses}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Business
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Businesses"
          value={businesses.length}
          icon={<Building2 className="h-4 w-4" />}
        />

        <StatCard
          label="Active"
          value={activeCount}
          icon={<span className="h-2 w-2 rounded-full bg-emerald-500" />}
        />

        <StatCard
          label="Trial"
          value={trialCount}
          icon={<span className="h-2 w-2 rounded-full bg-amber-500" />}
        />

        <StatCard
          label="Total Users"
          value={totalUsers}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-background">
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business, owner, email or ID..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "All" | BusinessStatus,
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-9 text-sm outline-none focus:border-foreground sm:w-40"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Trial">Trial</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <select
              value={planFilter}
              onChange={(event) =>
                setPlanFilter(event.target.value as "All" | BusinessPlan)
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground sm:w-36"
            >
              <option value="All">All Plans</option>
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
              <option value="Business">Business</option>
            </select>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Campaigns</th>
                <th className="px-5 py-3 font-medium">Users</th>
                <th className="px-5 py-3 font-medium">Last Active</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredBusinesses.map((business) => (
                <tr
                  key={business.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/admin/businesses/${business.id}`}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {business.name}
                        </Link>

                        <p className="text-xs text-muted-foreground">
                          {business.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm">{business.owner}</p>
                      <p className="text-xs text-muted-foreground">
                        {business.email}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${planStyles[business.plan]}`}
                    >
                      {business.plan}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[business.status]}`}
                    >
                      {business.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {business.campaigns}
                  </td>

                  <td className="px-5 py-4 text-sm">{business.users}</td>

                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {business.lastActive}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                      aria-label={`View ${business.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-border md:hidden">
          {filteredBusinesses.map((business) => (
            <div key={business.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {business.name}
                    </Link>

                    <p className="text-xs text-muted-foreground">
                      {business.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${planStyles[business.plan]}`}
                >
                  {business.plan}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[business.status]}`}
                >
                  {business.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniMetric label="Campaigns" value={business.campaigns} />
                <MiniMetric label="Users" value={business.users} />
                <MiniMetric label="Products" value={business.products} />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{business.owner}</span>
                <span>{business.lastActive}</span>
              </div>

              <Link
                href={`/admin/businesses/${business.id}`}
                className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
              >
                <Eye className="h-4 w-4" />
                View Business
              </Link>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredBusinesses.length === 0 && (
          <div className="px-6 py-16 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />

            <h3 className="mt-3 text-sm font-medium">
              No businesses found
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {filteredBusinesses.length} of {businesses.length}{" "}
            businesses
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-foreground px-2 text-xs text-background">
              1
            </span>

            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Business management controls will become functional after API
        integration.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>

        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
