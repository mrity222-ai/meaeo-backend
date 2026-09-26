"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Role = {
  id: string;
  name: string;
  description: string;
  users: number;
  status: "Active" | "System";
  permissions: number;
};

const roles: Role[] = [
  {
    id: "super-admin",
    name: "Super Admin",
    description: "Full access to the entire administration system.",
    users: 1,
    status: "System",
    permissions: 42,
  },
  {
    id: "admin",
    name: "Admin",
    description: "Manage users, businesses, campaigns and system data.",
    users: 3,
    status: "System",
    permissions: 36,
  },
  {
    id: "support-admin",
    name: "Support Admin",
    description: "Manage customer support and user account issues.",
    users: 2,
    status: "Active",
    permissions: 18,
  },
  {
    id: "content-manager",
    name: "Content Manager",
    description: "Manage campaigns, generated content and publishing.",
    users: 4,
    status: "Active",
    permissions: 15,
  },
  {
    id: "analytics-manager",
    name: "Analytics Manager",
    description: "View reports, analytics and business performance.",
    users: 2,
    status: "Active",
    permissions: 11,
  },
  {
    id: "billing-manager",
    name: "Billing Manager",
    description: "Manage subscriptions, invoices and payments.",
    users: 1,
    status: "Active",
    permissions: 9,
  },
];

const permissionGroups = [
  {
    name: "Users",
    permissions: ["View", "Create", "Edit", "Delete"],
  },
  {
    name: "Businesses",
    permissions: ["View", "Create", "Edit", "Delete"],
  },
  {
    name: "Campaigns",
    permissions: ["View", "Create", "Edit", "Delete"],
  },
  {
    name: "Content",
    permissions: ["View", "Create", "Edit", "Delete"],
  },
  {
    name: "Connections",
    permissions: ["View", "Create", "Edit", "Delete"],
  },
  {
    name: "Reports",
    permissions: ["View", "Create", "Export", "Delete"],
  },
  {
    name: "Analytics",
    permissions: ["View", "Export"],
  },
  {
    name: "AI & Automation",
    permissions: ["View", "Run", "Manage"],
  },
  {
    name: "Subscriptions",
    permissions: ["View", "Create", "Edit", "Delete"],
  },
  {
    name: "Payments",
    permissions: ["View", "Refund", "Export"],
  },
  {
    name: "System",
    permissions: ["View", "Manage"],
  },
  {
    name: "Audit Logs",
    permissions: ["View", "Export"],
  },
];

export default function AdminRolesPage() {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("super-admin");

  const filteredRoles = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query),
    );
  }, [search]);

  const activeRoles = roles.filter(
    (role) => role.status === "Active",
  ).length;

  const totalAssignedUsers = roles.reduce(
    (total, role) => total + role.users,
    0,
  );

  const selected = roles.find(
    (role) => role.id === selectedRole,
  );

  return (
    <div className="space-y-6 font-sans">
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

            <span className="text-neutral-950 font-medium">
              Roles & Permissions
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Roles & Permissions
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Control what administrators can access and manage.
          </p>
        </div>

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Shield className="h-5 w-5 text-purple-600" />}
          label="Total Roles"
          value={roles.length.toString()}
          description="Configured roles"
        />

        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
          label="Active Roles"
          value={activeRoles.toString()}
          description="Custom roles enabled"
        />

        <StatCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          label="Assigned Users"
          value={totalAssignedUsers.toString()}
          description="Users with admin roles"
        />

        <StatCard
          icon={<Lock className="h-5 w-5 text-amber-600" />}
          label="Permissions"
          value="42"
          description="Available permissions"
        />
      </div>

      {/* Main */}
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Roles List */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-neutral-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search roles..."
                className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition focus:border-neutral-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {filteredRoles.map((role) => {
              const isSelected = role.id === selectedRole;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex w-full items-start gap-3 p-4 text-left transition ${
                    isSelected
                      ? "bg-purple-50/70 border-l-4 border-l-purple-600"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                    <Shield className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-neutral-950">
                        {role.name}
                      </p>

                      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                      {role.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                        {role.users} users
                      </span>

                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                        {role.permissions} permissions
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Permissions Matrix */}
        <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-700">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-neutral-950 text-base">
                  {selected?.name}
                </h2>

                <p className="mt-1 max-w-xl text-xs text-neutral-500">
                  {selected?.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                Edit Role
              </Button>

              {selected?.status === "Active" && (
                <Button
                  variant="outline"
                  size="icon"
                  title="Delete role"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          </div>

          {/* Permission Table Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Module
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    View
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Create
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Edit
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Delete
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Other
                  </th>
                </tr>
              </thead>

              <tbody>
                {permissionGroups.map((group) => {
                  const permissions = group.permissions;

                  return (
                    <tr
                      key={group.name}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition"
                    >
                      <td className="px-5 py-4 font-semibold text-neutral-900">
                        {group.name}
                      </td>

                      <PermissionCell
                        enabled={permissions.includes("View")}
                      />

                      <PermissionCell
                        enabled={permissions.includes("Create")}
                      />

                      <PermissionCell
                        enabled={permissions.includes("Edit")}
                      />

                      <PermissionCell
                        enabled={permissions.includes("Delete")}
                      />

                      <td className="px-4 py-4 text-center">
                        {permissions
                          .filter(
                            (permission) =>
                              ![
                                "View",
                                "Create",
                                "Edit",
                                "Delete",
                              ].includes(permission),
                          )
                          .map((permission) => (
                            <span
                              key={permission}
                              className="mr-1 inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-700"
                            >
                              {permission}
                            </span>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 border-t border-neutral-200 bg-neutral-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Lock className="h-4 w-4" />

              <span>
                System roles have protected permissions.
              </span>
            </div>

            <Button>
              Save Permissions
            </Button>
          </div>
        </section>
      </div>

      {/* Mobile Permission Summary */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm xl:hidden">
        <div className="border-b border-neutral-100 pb-3 mb-3">
          <h2 className="font-semibold text-neutral-950">
            Permission Summary
          </h2>

          <p className="mt-1 text-xs text-neutral-500">
            Quick overview of permissions for{" "}
            <span className="font-semibold text-neutral-900">{selected?.name}</span>.
          </p>
        </div>

        <div className="divide-y divide-neutral-100">
          {permissionGroups.map((group) => (
            <div
              key={group.name}
              className="flex items-center justify-between gap-4 py-2.5"
            >
              <span className="text-xs font-medium text-neutral-900">
                {group.name}
              </span>

              <span className="text-xs font-semibold text-neutral-500">
                {group.permissions.length} permissions
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Security Notice */}
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-5">
        <div className="flex gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

          <div>
            <p className="text-sm font-semibold text-neutral-950">
              Permission enforcement will be connected later
            </p>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              This stage builds the RBAC management interface.
              Actual permission enforcement, protected admin APIs,
              role persistence and authentication will be implemented
              during the Admin API Integration and Authentication
              stages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionCell({
  enabled,
}: {
  enabled: boolean;
}) {
  return (
    <td className="px-4 py-4 text-center">
      {enabled ? (
        <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          <Check className="h-4 w-4" />
        </span>
      ) : (
        <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
          <X className="h-4 w-4" />
        </span>
      )}
    </td>
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
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 border border-neutral-200">
        {icon}
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
