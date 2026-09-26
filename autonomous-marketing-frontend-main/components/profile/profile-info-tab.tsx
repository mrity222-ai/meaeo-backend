"use client";

import { useState, useEffect } from "react";
import {
  Check,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { getUserMeta, getTenantId, clearAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function ProfileInfoTab() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Marketing User",
    email: "",
    phone: "Not configured",
    role: "Workspace Owner",
    workspaceName: "My Business Workspace",
    workspaceId: "",
  });

  useEffect(() => {
    const meta = getUserMeta();
    const tid = getTenantId();
    setProfile((prev) => ({
      ...prev,
      fullName: meta.name || prev.fullName,
      email: meta.email || prev.email,
      workspaceId: tid || "Default Workspace",
    }));
  }, []);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    productUpdates: true,
    weeklyReport: true,
  });

  const handleSaveProfile = () => {
    setIsEditing(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  const initials = (profile.fullName ? profile.fullName.slice(0, 2) : "US").toUpperCase();

  return (
    <div className="space-y-8">
      {savedMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <Check size={16} />
          Profile updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Columns */}
        <div className="space-y-8 lg:col-span-2">
          {/* 1. Profile Information */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">Personal Information</h2>
                <p className="text-xs text-neutral-500">Your profile credentials and contact details.</p>
              </div>
              <button
                onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                {isEditing ? "Save Changes" : "Edit Profile"}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xl font-bold text-white shadow-xs">
                {initials}
                <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-neutral-800 text-white">
                  <User size={12} />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-neutral-950">{profile.fullName}</h3>
                <p className="text-xs font-medium text-neutral-500">{profile.role}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <Mail size={13} />
                  <span>{profile.email || "Active User"}</span>
                </div>
              </div>
            </div>

            <hr className="my-6 border-neutral-100" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-neutral-500">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold text-neutral-950">{profile.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold text-neutral-950">{profile.email || "—"}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500">Phone Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold text-neutral-950">{profile.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500">Workspace Role</label>
                <p className="mt-1 text-sm font-semibold text-neutral-950">{profile.role}</p>
              </div>
            </div>
          </section>

          {/* 2. Workspace & Team */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">Workspace Details</h2>
                <p className="text-xs text-neutral-500">Current workspace identifier and members.</p>
              </div>

              <button className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-3.5 text-xs font-medium text-white hover:bg-neutral-800 transition">
                <UserPlus size={14} />
                Invite Member
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-neutral-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs text-neutral-500">Workspace Name</p>
                  <p className="text-sm font-bold text-neutral-950">{profile.workspaceName}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Workspace ID</p>
                  <p className="text-xs font-mono font-semibold text-neutral-700">{profile.workspaceId}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Owner</p>
                  <p className="text-xs font-semibold text-neutral-900">{profile.fullName} (You)</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-neutral-900">Team Members (1)</h3>

              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3.5 transition hover:bg-neutral-50/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-800">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">{profile.fullName} (You)</p>
                      <p className="text-xs text-neutral-500">{profile.email || "Active Account"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-neutral-600">{profile.role}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* 3. Account Security */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-neutral-950">Account Security</h2>
            <p className="text-xs text-neutral-500">Security status and credentials</p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3.5">
                <div>
                  <p className="text-xs font-medium text-neutral-500">2FA Status</p>
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={14} />
                    Active (TOTP)
                  </p>
                </div>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                  Protected
                </span>
              </div>

              <div className="rounded-xl border border-neutral-100 p-3.5">
                <p className="text-xs font-medium text-neutral-500">Session Status</p>
                <p className="mt-1 text-xs font-semibold text-neutral-900">Current Device Active</p>
                <p className="text-[11px] text-neutral-500">Web Browser / Secure Token</p>
              </div>

              <button className="h-9 w-full rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition">
                Change Password
              </button>
            </div>
          </section>

          {/* 4. Account Actions */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-neutral-950">Quick Sign Out</h2>
            <p className="text-xs text-neutral-500">End your current active session</p>

            <div className="mt-4 space-y-3">
              <button
                onClick={handleLogout}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
              >
                <LogOut size={15} />
                Sign Out from Account
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
