import { apiRequest } from "./client";
import { getTenantId } from "@/lib/auth";

export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "pending" | "in-progress" | "resolved" | "closed";
export type TicketCategory =
  | "Technical"
  | "Connections"
  | "Billing"
  | "Campaigns"
  | "AI Generation"
  | "General"
  | string;

export type SupportTicket = {
  id: number;
  ticket_number: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  last_message?: string | null;
  created_at: string;
  updated_at?: string | null;
  customer?: string;
  user_email?: string;
  messages_count?: number;
};

export type SupportMessageItem = {
  id: number;
  sender_type: "user" | "admin" | string;
  sender_email?: string | null;
  message: string;
  created_at: string;
};

export type TicketDetail = {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at?: string | null;
  messages: SupportMessageItem[];
};

export type CreateTicketPayload = {
  subject: string;
  message: string;
  description?: string;
  category?: string;
  priority?: string;
};

export type CreateTicketResponse = {
  status: string;
  ticket_id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  created_at: string;
};

function getHeaders(): Record<string, string> {
  const tenantId = getTenantId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
  }
  return headers;
}

/**
 * Submit a new support ticket.
 */
export async function createSupportTicket(
  payload: CreateTicketPayload,
): Promise<CreateTicketResponse> {
  return apiRequest<CreateTicketResponse>("/support/tickets", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
}

/**
 * List all tickets raised by the current workspace/user.
 */
export async function getUserSupportTickets(): Promise<SupportTicket[]> {
  return apiRequest<SupportTicket[]>("/support/tickets", {
    method: "GET",
    headers: getHeaders(),
  });
}

/**
 * Get ticket details and full conversation history.
 */
export async function getTicketDetails(
  ticketIdOrNumber: string | number,
): Promise<TicketDetail> {
  return apiRequest<TicketDetail>(`/support/tickets/${encodeURIComponent(ticketIdOrNumber)}`, {
    method: "GET",
    headers: getHeaders(),
  });
}

/**
 * Post a user reply to an existing ticket.
 */
export async function replyToTicket(
  ticketIdOrNumber: string | number,
  message: string,
): Promise<{ status: string; message_id: number; created_at: string }> {
  return apiRequest<{ status: string; message_id: number; created_at: string }>(
    `/support/tickets/${encodeURIComponent(ticketIdOrNumber)}/messages`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    },
  );
}

/**
 * Admin: List all tickets across tenants.
 */
export async function adminGetAllTickets(
  statusFilter?: string,
): Promise<SupportTicket[]> {
  const query = statusFilter && statusFilter !== "all" ? `?status_filter=${encodeURIComponent(statusFilter)}` : "";
  return apiRequest<SupportTicket[]>(`/support/admin/all-tickets${query}`, {
    method: "GET",
    headers: getHeaders(),
  });
}

/**
 * Admin: Update ticket status or priority, and optionally post an admin reply.
 */
export async function adminUpdateTicket(
  ticketIdOrNumber: string | number,
  data: {
    status?: string;
    priority?: string;
    admin_reply?: string;
  },
): Promise<{
  status: string;
  ticket_id: number;
  ticket_number: string;
  new_status: string;
  new_priority: string;
}> {
  return apiRequest(
    `/support/admin/tickets/${encodeURIComponent(ticketIdOrNumber)}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    },
  );
}
