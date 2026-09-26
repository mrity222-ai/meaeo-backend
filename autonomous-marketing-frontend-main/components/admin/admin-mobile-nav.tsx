"use client";

import { AdminSidebar } from "./admin-sidebar";

type AdminMobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminMobileNav({ open, onClose }: AdminMobileNavProps) {
  return <AdminSidebar open={open} onClose={onClose} />;
}
