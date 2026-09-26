"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  MoreHorizontal,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { useEffect, useMemo, useState } from "react";

type PaymentStatus =
  | "Succeeded"
  | "Failed"
  | "Refunded"
  | "Pending";

type PaymentMethod =
  | "Card"
  | "UPI"
  | "Net Banking"
  | "Razorpay";

type Payment = {
  id: string;
  transaction: string;
  customer: string;
  email: string;
  business: string;
  plan: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: string;
};

const statusStyles: Record<PaymentStatus, string> = {
  Succeeded:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  Refunded:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Pending:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    let isMounted = true;
    async function loadPayments() {
      try {
        const data = await apiRequest<Payment[]>("/payments/admin/transactions");
        if (isMounted && Array.isArray(data)) {
          setPayments(data);
        }
      } catch (err) {
        console.warn("Using fallback/empty transactions:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPayments();
    return () => { isMounted = false; };
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const query = search.toLowerCase();

      const matchesSearch =
        payment.customer.toLowerCase().includes(query) ||
        payment.email.toLowerCase().includes(query) ||
        payment.business.toLowerCase().includes(query) ||
        payment.transaction.toLowerCase().includes(query) ||
        payment.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const succeeded = payments.filter(
    (payment) => payment.status === "Succeeded",
  );

  const successfulRevenue = succeeded.reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const failedCount = payments.filter(
    (payment) => payment.status === "Failed",
  ).length;

  const refundedAmount = payments
    .filter((payment) => payment.status === "Refunded")
    .reduce((total, payment) => total + payment.amount, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Billing
            <span>/</span>
            Payments
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Payments
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor transactions, revenue, failures, and refunds.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Mock notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

        <div>
          <p className="text-sm font-medium">
            Payment provider preview
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Transactions shown here are mock records. Real payment
            provider webhooks and transaction data will be connected
            during Admin API Integration.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Successful Revenue"
          value={formatCurrency(successfulRevenue)}
          change="+14.6%"
          positive
          icon={<DollarSign className="h-5 w-5" />}
        />

        <MetricCard
          label="Successful Payments"
          value={succeeded.length.toString()}
          change="+9.2%"
          positive
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <MetricCard
          label="Failed Payments"
          value={failedCount.toString()}
          change="-3.7%"
          positive
          icon={<XCircle className="h-5 w-5" />}
        />

        <MetricCard
          label="Refunded"
          value={formatCurrency(refundedAmount)}
          change="+1.8%"
          positive={false}
          icon={<RotateCcw className="h-5 w-5" />}
        />
      </div>

      {/* Payment health */}
      <section className="grid gap-4 md:grid-cols-3">
        <HealthCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Success Rate"
          value="94.8%"
          description="Payments completed successfully"
        />

        <HealthCard
          icon={<RefreshCcw className="h-5 w-5" />}
          title="Refund Rate"
          value="2.1%"
          description="Percentage of processed payments"
        />

        <HealthCard
          icon={<Clock3 className="h-5 w-5" />}
          title="Pending"
          value="1"
          description="Payments awaiting confirmation"
        />
      </section>

      {/* Filters */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, business, transaction ID..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm outline-none transition focus:border-foreground"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Succeeded">Succeeded</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </section>

      {/* Desktop table */}
      <section className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-4 font-medium">Transaction</th>
                <th className="px-5 py-4 font-medium">Customer</th>
                <th className="px-5 py-4 font-medium">Plan</th>
                <th className="px-5 py-4 font-medium">Method</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">
                  Amount
                </th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="transition hover:bg-muted/20"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium">
                      {payment.transaction}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {payment.id}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium">
                      {payment.customer}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {payment.business}
                    </div>
                  </td>

                  <td className="px-5 py-4">{payment.plan}</td>

                  <td className="px-5 py-4">{payment.method}</td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[payment.status]}`}
                    >
                      {payment.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right font-medium">
                    {formatCurrency(payment.amount)}
                  </td>

                  <td className="px-5 py-4 text-xs text-muted-foreground">
                    {payment.date}
                  </td>

                  <td className="px-5 py-4">
                    <button className="rounded-lg p-2 hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination count={filteredPayments.length} />
      </section>

      {/* Mobile cards */}
      <section className="space-y-3 lg:hidden">
        {filteredPayments.map((payment) => (
          <article
            key={payment.id}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{payment.customer}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {payment.business}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[payment.status]}`}
              >
                {payment.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoItem
                label="Transaction"
                value={payment.transaction}
              />

              <InfoItem
                label="Amount"
                value={formatCurrency(payment.amount)}
              />

              <InfoItem label="Plan" value={payment.plan} />

              <InfoItem label="Method" value={payment.method} />
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                {payment.date}
              </p>
            </div>
          </article>
        ))}

        <Pagination count={filteredPayments.length} />
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  positive,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          {icon}
        </div>

        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            positive ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {positive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}

          {change}
        </span>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{label}</p>

      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function HealthCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <p className="mt-5 text-2xl font-semibold">{value}</p>
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

function Pagination({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-4">
      <p className="text-xs text-muted-foreground">
        Showing {count} transaction{count === 1 ? "" : "s"}
      </p>

      <div className="flex items-center gap-1">
        <button className="rounded-lg border border-border p-2 hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-foreground px-2 text-xs text-background">
          1
        </span>

        <button className="rounded-lg border border-border p-2 hover:bg-muted">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
