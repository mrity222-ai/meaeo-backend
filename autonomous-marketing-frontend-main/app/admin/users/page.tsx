"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";

type UserStatus = "Active" | "Suspended" | "Pending";
type UserPlan = "Free" | "Pro" | "Business";

type User = {
  id: string;
  raw_id?: number;
  name: string;
  email: string;
  company: string;
  plan: UserPlan;
  status: UserStatus;
  role: string;
  campaigns: number;
  joined: string;
  lastActive: string;
  is_active?: boolean;
};

const statusStyles: Record<UserStatus, string> = {
  Active:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Suspended:
    "bg-red-500/10 text-red-600 dark:text-red-400",
  Pending:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const planStyles: Record<UserPlan, string> = {
  Free: "bg-muted text-muted-foreground",
  Pro: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Business:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | UserStatus>(
    "All",
  );
  const [planFilter, setPlanFilter] = useState<"All" | UserPlan>("All");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiRequest<User[]>("/admin/users");
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(user: User, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const rawId = user.raw_id ?? parseInt(user.id.replace(/\D/g, ""), 10);
    const newActiveState = !(user.is_active ?? (user.status === "Active"));
    setUpdatingId(user.id);
    try {
      await apiRequest(`/admin/users/${rawId}/status?is_active=${newActiveState}`, {
        method: "PATCH",
      });
      await loadUsers();
    } catch (err) {
      console.error("Failed to update user status:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!userToDelete) return;
    const rawId =
      userToDelete.raw_id ?? parseInt(userToDelete.id.replace(/\D/g, ""), 10);
    setIsDeleting(true);
    try {
      await apiRequest(`/admin/users/${rawId}`, {
        method: "DELETE",
      });
      setUserToDelete(null);
      await loadUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.company.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      const matchesPlan =
        planFilter === "All" || user.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [users, search, statusFilter, planFilter]);

  const activeUsers = users.filter((user) => user.status === "Active").length;
  const pendingUsers = users.filter(
    (user) => user.status === "Pending",
  ).length;
  const suspendedUsers = users.filter(
    (user) => user.status === "Suspended",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-neutral-500">
            <Link
              href="/admin/dashboard"
              className="hover:text-neutral-950 transition"
            >
              Admin
            </Link>
            <span>/</span>
            <span className="text-neutral-950 font-medium">Users</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-neutral-950">
            User Management
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Manage real-time users, workspaces, plans, and account status from your database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadUsers}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          label="Total Users"
          value={users.length.toString()}
          description="All registered accounts"
        />

        <StatCard
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
          label="Active Users"
          value={activeUsers.toString()}
          description="Currently active"
        />

        <StatCard
          icon={<UserPlus className="h-5 w-5 text-amber-600" />}
          label="Pending"
          value={pendingUsers.toString()}
          description="Awaiting activation"
        />

        <StatCard
          icon={<UserX className="h-5 w-5 text-red-600" />}
          label="Suspended"
          value={suspendedUsers.toString()}
          description="Restricted accounts"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, company or user ID..."
              className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition focus:border-neutral-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "All" | UserStatus,
                )
              }
              className="h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select
              value={planFilter}
              onChange={(event) =>
                setPlanFilter(
                  event.target.value as "All" | UserPlan,
                )
              }
              className="h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm focus:outline-none"
            >
              <option value="All">All Plans</option>
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
              <option value="Business">Business</option>
            </select>

            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Campaigns</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Active</th>
                <th className="px-5 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar name={user.name} />

                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 hover:underline">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-neutral-500">
                          {user.email}
                        </p>

                        <p className="mt-0.5 text-[11px] font-mono text-neutral-400">
                          {user.id}
                        </p>
                      </div>
                    </Link>
                  </td>

                  <td className="px-5 py-4 font-medium text-neutral-900">
                    {user.company}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${planStyles[user.plan]}`}
                    >
                      {user.plan}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-neutral-500">
                    {user.role}
                  </td>

                  <td className="px-5 py-4 font-semibold text-neutral-900">
                    {user.campaigns}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[user.status]}`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-neutral-500">
                    {user.lastActive}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant={user.status === "Active" ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => handleToggleStatus(user, e)}
                        disabled={updatingId === user.id}
                        className={`text-xs h-8 px-2.5 ${
                          user.status === "Active"
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {updatingId === user.id
                          ? "..."
                          : user.status === "Active"
                          ? "Suspend"
                          : "Activate"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserToDelete(user);
                        }}
                        className="text-xs h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        title="Delete User and Business"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>

                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-neutral-600" />
                          <span className="sr-only">
                            View user
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-neutral-100 md:hidden">
          {filteredUsers.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="block p-4 transition hover:bg-neutral-50"
            >
              <div className="flex items-start gap-3">
                <Avatar name={user.name} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-900">{user.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {user.email}
                      </p>
                    </div>

                    <MoreHorizontal className="h-4 w-4 shrink-0 text-neutral-400" />
                  </div>

                  <p className="mt-2 text-sm text-neutral-600">
                    {user.company}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${planStyles[user.plan]}`}
                    >
                      {user.plan}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[user.status]}`}
                    >
                      {user.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                    <span>{user.campaigns} campaigns</span>
                    <span>{user.lastActive}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-neutral-100 pt-2">
                    <Button
                      variant={user.status === "Active" ? "outline" : "default"}
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleStatus(user, e);
                      }}
                      disabled={updatingId === user.id}
                      className={`text-xs h-7 px-2.5 ${
                        user.status === "Active"
                          ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {updatingId === user.id
                        ? "..."
                        : user.status === "Active"
                        ? "Suspend"
                        : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUserToDelete(user);
                      }}
                      className="text-xs h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty */}
        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Users className="mb-3 h-8 w-8 text-neutral-400" />

            <h3 className="font-medium text-neutral-900">No users found</h3>

            <p className="mt-1 text-sm text-neutral-500">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            Showing{" "}
            <span className="font-semibold text-neutral-950">
              {filteredUsers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-neutral-950">
              {users.length}
            </span>{" "}
            users
          </p>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <span className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-50">
              1
            </span>

            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Note */}
      <div className="rounded-2xl border border-dashed border-neutral-300 p-4 bg-white">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

          <div>
            <p className="text-sm font-semibold text-neutral-950">
              User actions are currently UI-only
            </p>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Account suspension, deletion, plan changes, password
              resets, and role changes will be connected to the backend
              during the Admin API Integration stage.
            </p>
          </div>
        </div>
      </div>

      {/* Delete User & Business Warning Modal */}
      {userToDelete && (
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
                  User ID: <span className="font-mono font-medium">{userToDelete.id}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-red-50 p-4 text-xs text-red-900 border border-red-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300 leading-relaxed">
              <p className="font-semibold text-sm mb-1 text-red-950 dark:text-red-200">
                Are you sure you want to delete this user?
              </p>
              <p className="mb-2">
                User: <strong>{userToDelete.name}</strong> ({userToDelete.email})
              </p>
              <p className="font-medium">
                This action will permanently delete:
              </p>
              <ul className="mt-1.5 list-disc pl-4 space-y-1 text-neutral-700 dark:text-neutral-300">
                <li>Associated Business: <strong className="text-red-900 dark:text-red-300">{userToDelete.company}</strong></li>
                <li>All campaigns ({userToDelete.campaigns}), scheduled & published posts</li>
                <li>Brand profile, channels, media assets, tickets & subscriptions</li>
              </ul>
              <p className="mt-2.5 font-bold text-red-700 dark:text-red-400">
                ⚠️ This operation cannot be cancelled or undone.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 shadow-sm"
              >
                {isDeleting ? (
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

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 font-bold text-xs text-white">
      {initials}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 border border-neutral-200">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-neutral-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-neutral-500">
        {description}
      </p>
    </div>
  );
}
