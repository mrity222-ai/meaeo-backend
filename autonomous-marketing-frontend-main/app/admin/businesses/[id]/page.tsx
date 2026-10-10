"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Database,
  Edit3,
  Globe2,
  Image,
  Instagram,
  Layers3,
  MoreHorizontal,
  Package,
  PauseCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { apiRequest } from "@/lib/api/client";

type BusinessStatus = "Active" | "Trial" | "Suspended";

type ChannelDetail = {
  id: number;
  platform: string;
  name: string;
  account_name: string;
  handle: string;
  connected: boolean;
  external_account_id: string;
  status: string;
};

type BusinessDetail = {
  id: string;
  raw_id: number;
  name: string;
  owner: string;
  owner_user_id?: number;
  email: string;
  phone: string;
  website: string;
  plan: string;
  status: BusinessStatus;
  created: string;
  lastActive: string;
  industry: string;
  category: string;
  location: string;
  description: string;
  campaigns: number;
  users: number;
  products: number;
  tenant_id: string;
  channels: ChannelDetail[];
};

const statusStyles: Record<BusinessStatus, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Suspended: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function AdminBusinessDetailPage() {
  const params = useParams();
  const businessId = params?.id as string;

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<BusinessStatus>("Active");

  useEffect(() => {
    if (businessId) {
      loadBusiness();
    }
  }, [businessId]);

  async function loadBusiness() {
    setLoading(true);
    try {
      const data = await apiRequest<BusinessDetail>(
        `/admin/businesses/${businessId}`
      );
      setBusiness(data);
      setStatus(data.status);
    } catch (err) {
      console.error("Failed to load business details:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSuspend() {
    setStatus((current) =>
      current === "Suspended" ? "Active" : "Suspended"
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading business details...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/admin/businesses"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Businesses
        </Link>
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-lg font-medium text-foreground">Business not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Could not retrieve details for business {businessId}.
          </p>
        </div>
      </div>
    );
  }

  const ownerInitials = business.owner
    ? business.owner
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "BO";

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground">
          Admin
        </Link>

        <ChevronRight className="h-4 w-4" />

        <Link href="/admin/businesses" className="hover:text-foreground">
          Businesses
        </Link>

        <ChevronRight className="h-4 w-4" />

        <span>{business.id}</span>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-background">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {business.name}
                </h1>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {business.id} · {business.industry}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{business.location}</span>
                <span>Created {business.created}</span>
                <span>Active {business.lastActive}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadBusiness}
              className="ui-button-secondary inline-flex h-9 items-center gap-2 border border-border px-3 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={toggleSuspend}
              className="ui-button-secondary inline-flex h-9 items-center gap-2 border border-border px-3 text-sm font-medium"
            >
              {status === "Suspended" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Activate
                </>
              ) : (
                <>
                  <PauseCircle className="h-4 w-4 text-amber-500" />
                  Suspend
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Campaigns"
          value={business.campaigns.toString()}
          detail="Total created"
          icon={<BarChart3 className="h-4 w-4" />}
        />

        <MetricCard
          label="Catalogue Posts"
          value={business.products.toString()}
          detail="Total posts"
          icon={<Package className="h-4 w-4" />}
        />

        <MetricCard
          label="Team Members"
          value={business.users.toString()}
          detail="Owner account"
          icon={<Users className="h-4 w-4" />}
        />

        <MetricCard
          label="Plan"
          value={business.plan}
          detail="Free tier"
          icon={<Zap className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Business profile */}
          <section className="rounded-2xl border border-border bg-background">
            <div className="border-b border-border p-5 sm:p-6">
              <h2 className="font-semibold">Business Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Core business information synced from database.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <InfoItem label="Business Name" value={business.name} />
              <InfoItem label="Business ID" value={business.id} />
              <InfoItem label="Category / Industry" value={business.industry} />
              <InfoItem label="Location" value={business.location} />
              <InfoItem label="Owner" value={business.owner} />
              <InfoItem label="Email" value={business.email} />
              <InfoItem label="Phone" value={business.phone} />
              <InfoItem label="Website" value={business.website} />

              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-1 text-sm leading-6">
                  {business.description || "No description provided."}
                </p>
              </div>
            </div>
          </section>

          {/* Social Channels */}
          <section className="rounded-2xl border border-border bg-background">
            <div className="border-b border-border p-5 sm:p-6">
              <h2 className="font-semibold">Connected Marketing Channels</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Social media platforms configured for this business.
              </p>
            </div>

            {business.channels && business.channels.length > 0 ? (
              <div className="divide-y divide-border">
                {business.channels.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted">
                        <Globe2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ch.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ch.handle || ch.account_name || "Connected"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                      {ch.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No external channels connected yet.
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner */}
          <section className="rounded-2xl border border-border bg-background">
            <div className="border-b border-border p-5">
              <h2 className="font-semibold">Business Owner</h2>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {ownerInitials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {business.owner}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {business.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <InfoItem label="Role" value="Business Owner" />
                <InfoItem label="Created" value={business.created} />
                <InfoItem label="Status" value={business.status} />
              </div>

              {business.owner_user_id && (
                <Link
                  href={`/admin/users/USR-${String(business.owner_user_id).padStart(4, "0")}`}
                  className="ui-button-secondary mt-5 flex h-9 w-full items-center justify-center gap-2 border border-border text-sm font-medium"
                >
                  View User Profile
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </section>

          {/* Subscription */}
          <section className="rounded-2xl border border-border bg-background">
            <div className="border-b border-border p-5">
              <h2 className="font-semibold">Subscription & Plan</h2>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{business.plan} Plan</p>
                  <p className="text-xs text-muted-foreground">
                    Standard business workspace
                  </p>
                </div>

                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {business.status}
                </span>
              </div>

              <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                <p>• Campaigns: {business.campaigns}</p>
                <p>• Posts / Catalogue: {business.products}</p>
                <p>• Tenant UUID: <span className="font-mono text-[11px]">{business.tenant_id}</span></p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-semibold tracking-tight">{value}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
