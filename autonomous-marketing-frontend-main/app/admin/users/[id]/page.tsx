"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Mail,
  Megaphone,
  MoreHorizontal,
  RefreshCw,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";

type UserDetail = {
  id: string;
  raw_id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  plan: string;
  status: "Active" | "Suspended";
  role: string;
  joined: string;
  lastActive: string;
  campaigns: number;
  totalPosts: number;
  connectedAccounts: number;
  monthlySpend: string;
  is_active: boolean;
  businesses?: Array<{
    id: string;
    tenant_id: string;
    name: string;
    category: string;
    campaigns: number;
    status: string;
  }>;
  recentActivity?: Array<{
    title: string;
    description: string;
    time: string;
  }>;
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  async function loadUser() {
    setLoading(true);
    try {
      const data = await apiRequest<UserDetail>(`/admin/users/${userId}`);
      setUser(data);
    } catch (err) {
      console.error("Failed to load user detail:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    if (!user) return;
    setUpdating(true);
    try {
      const nextActive = !user.is_active;
      await apiRequest(`/admin/users/${user.raw_id}/status?is_active=${nextActive}`, {
        method: "PATCH",
      });
      await loadUser();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteUser() {
    if (!user) return;
    setDeleting(true);
    try {
      await apiRequest(`/admin/users/${user.raw_id}`, {
        method: "DELETE",
      });
      router.push("/admin/users");
    } catch (err) {
      console.error("Failed to delete user:", err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-950 transition"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
        <div className="rounded-xl border border-border p-8 text-center">
          <p className="text-lg font-medium text-foreground">User not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Could not retrieve details for user {userId}.
          </p>
        </div>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-950 transition"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-lg font-bold text-white shadow-md">
              {initials}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                  {user.name}
                </h1>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
                    user.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {user.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-neutral-500">{user.email}</p>

              <p className="mt-1 text-xs font-mono text-neutral-400">
                {user.id}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={`mailto:${user.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </a>
            </Button>

            <Button
              variant="outline"
              onClick={toggleStatus}
              disabled={updating || deleting}
            >
              {user.is_active ? (
                <>
                  <Ban className="mr-2 h-4 w-4 text-red-500" />
                  Suspend User
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />
                  Activate User
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              disabled={updating || deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-600" />
              Delete User
            </Button>

            <Button variant="outline" onClick={loadUser}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={<Megaphone className="h-5 w-5 text-purple-600" />}
          label="Campaigns"
          value={user.campaigns.toString()}
        />

        <InfoCard
          icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
          label="Content Posts"
          value={user.totalPosts.toString()}
        />

        <InfoCard
          icon={<Building2 className="h-5 w-5 text-emerald-600" />}
          label="Connected Businesses"
          value={user.connectedAccounts.toString()}
        />

        <InfoCard
          icon={<CreditCard className="h-5 w-5 text-amber-600" />}
          label="Plan"
          value={user.plan}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Account Information */}
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 p-5">
              <h2 className="font-semibold text-neutral-950">
                Account Information
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Basic account and workspace information.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <DetailItem label="Full Name" value={user.name} />

              <DetailItem label="Email" value={user.email} />

              <DetailItem label="Phone" value={user.phone} />

              <DetailItem label="Company" value={user.company} />

              <DetailItem label="Plan" value={user.plan} />

              <DetailItem label="Role" value={user.role} />

              <DetailItem label="Joined" value={user.joined} />

              <DetailItem label="Last Active" value={user.lastActive} />
            </div>
          </section>

          {/* Linked Businesses */}
          {user.businesses && user.businesses.length > 0 && (
            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-100 p-5">
                <h2 className="font-semibold text-neutral-950">
                  Associated Businesses
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Business profiles registered or managed by this user.
                </p>
              </div>

              <div className="divide-y divide-neutral-100">
                {user.businesses.map((biz) => (
                  <div
                    key={biz.tenant_id}
                    className="flex items-center justify-between p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <Link
                          href={`/admin/businesses/${biz.id}`}
                          className="font-medium text-sm text-neutral-900 hover:underline"
                        >
                          {biz.name}
                        </Link>
                        <p className="text-xs text-neutral-500">
                          {biz.category} • {biz.campaigns} campaigns
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                      {biz.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Activity */}
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 p-5">
              <h2 className="font-semibold text-neutral-950">Recent Activity</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Latest activity from this account.
              </p>
            </div>

            <div className="divide-y divide-neutral-100">
              {(user.recentActivity || []).map((activity, idx) => (
                <div
                  key={`${activity.title}-${idx}`}
                  className="flex gap-4 p-5"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 border border-purple-100 text-purple-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {activity.title}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {activity.description}
                    </p>

                    <p className="mt-2 text-[11px] text-neutral-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 p-5">
              <h2 className="font-semibold text-neutral-950">Account Controls</h2>
            </div>

            <div className="space-y-3 p-5">
              <div className="rounded-lg border border-neutral-200 p-3 bg-neutral-50 text-xs text-neutral-600">
                <p className="font-medium text-neutral-900 mb-1">Live Database Record</p>
                This user is synced directly with SQLite <code>app.db</code>. Changes to activation status apply immediately.
              </div>

              <button
                type="button"
                onClick={toggleStatus}
                disabled={updating}
                className="w-full flex items-center justify-between rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                <span className="flex items-center">
                  <Ban className="mr-3 h-4 w-4 text-neutral-500" />
                  Toggle Suspend/Active
                </span>
                <span className="text-xs text-neutral-400">{user.status}</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Delete User & Business Warning Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Delete User & Associated Business
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  User ID: <span className="font-mono font-medium">{user.id}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-red-50 p-4 text-xs text-red-900 border border-red-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300 leading-relaxed">
              <p className="font-semibold text-sm mb-1 text-red-950 dark:text-red-200">
                Are you sure you want to delete this user?
              </p>
              <p className="mb-2">
                User: <strong>{user.name}</strong> ({user.email})
              </p>
              <p className="font-medium">
                This action will permanently delete:
              </p>
              <ul className="mt-1.5 list-disc pl-4 space-y-1 text-neutral-700 dark:text-neutral-300">
                <li>Associated Business: <strong className="text-red-900 dark:text-red-300">{user.company}</strong></li>
                <li>All campaigns ({user.campaigns}), scheduled & published posts</li>
                <li>Brand profile, channels, media assets, tickets & subscriptions</li>
              </ul>
              <p className="mt-2.5 font-bold text-red-700 dark:text-red-400">
                ⚠️ This operation cannot be cancelled or undone.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 shadow-sm"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{label}</p>
        {icon}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-neutral-950">
          {value}
        </h3>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}
