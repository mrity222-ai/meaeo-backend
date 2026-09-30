import { MarketingLayout } from "@/components/layout/marketing-layout";
import { RefreshCw, CreditCard, Clock, HelpCircle, CheckCircle2, Building2 } from "lucide-react";

export const metadata = {
  title: "Refund & Cancellation Policy - maeaco by Aveda Technologies",
  description: "Refund Policy and Subscription Cancellation terms for maeaco platform, operated by Aveda Technologies.",
};

export default function RefundPolicyPage() {
  return (
    <MarketingLayout>
      <div className="bg-gradient-to-b from-purple-50/50 to-white py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              <RefreshCw className="h-4 w-4" />
              <span>Billing & Payments</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-5xl">
              Refund & Cancellation Policy
            </h1>
            <p className="mt-3 text-base text-zinc-600">
              Transparent rules regarding subscription cancellations, money-back guarantees, and refund processing for <strong>maeaco</strong> services operated by{" "}
              <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold underline">
                Aveda Technologies
              </a>.
            </p>
          </div>

          {/* Policy Content */}
          <div className="mt-12 space-y-10 text-zinc-700 leading-relaxed text-sm lg:text-base">

            {/* Merchant Entity Statement */}
            <section className="rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-purple-900">
                <Building2 className="h-5 w-5 text-purple-600" />
                Merchant Entity Disclosure
              </h2>
              <p className="mt-3 text-purple-950">
                All payment transactions, subscriptions, and invoicing for <strong>maeaco</strong> are processed under the merchant name <strong>Aveda Technologies</strong> (<a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-purple-700">www.avedatechnologies.com</a>). Billing charges on your bank or credit card statement will appear as <strong>&quot;AVEDA TECHNOLOGIES&quot;</strong> or <strong>&quot;MAEACO BY AVEDA&quot;</strong>.
              </p>
            </section>

            {/* Section 1 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                1. 7-Day Money-Back Guarantee
              </h2>
              <p className="mt-3">
                We stand behind the quality of the <strong>maeaco Autonomous Marketing System</strong>. If you subscribe to any paid plan and are not satisfied with the platform for any reason, you are eligible for a <strong>100% full refund within 7 days</strong> of your initial purchase.
              </p>
              <p className="mt-2 text-zinc-600">
                To claim a 7-day money-back refund, simply send an email to <a href="mailto:billing@avedatechnologies.com" className="text-purple-600 font-semibold underline">billing@avedatechnologies.com</a> or <a href="mailto:support@avedatechnologies.com" className="text-purple-600 font-semibold underline">support@avedatechnologies.com</a>.
              </p>
            </section>

            {/* Section 2 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <CreditCard className="h-5 w-5 text-purple-600" />
                2. Subscription Cancellation Rules
              </h2>
              <p className="mt-3">
                You can cancel your recurring monthly or annual subscription at any time:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-600">
                <li>Go to <strong>Settings ➔ Subscription</strong> in your maeaco dashboard and click <strong>Cancel Subscription</strong>.</li>
                <li>Upon cancellation, your subscription will remain active until the end of the current paid billing cycle.</li>
                <li>You will not be charged for subsequent billing cycles after cancellation.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <Clock className="h-5 w-5 text-purple-600" />
                3. Refund Processing Timeline
              </h2>
              <p className="mt-3">
                Approved refund requests are credited back to the original payment method used during checkout (Razorpay / Credit Card / Debit Card / Net Banking / UPI):
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-600">
                <li><strong>Processing Time:</strong> Refunds are approved by Aveda Technologies Billing Operations within 24 hours of verification.</li>
                <li><strong>Bank Credit Timeline:</strong> It typically takes <strong>5 to 7 business days</strong> for the refunded amount to reflect in your bank account or card statement, depending on your financial institution.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <HelpCircle className="h-5 w-5 text-purple-600" />
                4. Contact Billing Support
              </h2>
              <p className="mt-3">
                For any billing inquiries, invoice requests, or refund assistance, our dedicated billing team at Aveda Technologies is available:
              </p>
              <div className="mt-4 rounded-xl bg-purple-50 p-4 font-mono text-xs sm:text-sm text-purple-900 border border-purple-200">
                <strong>Aveda Technologies — Billing Division</strong><br />
                Official Website: <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">www.avedatechnologies.com</a><br />
                Billing Email: billing@avedatechnologies.com<br />
                General Support: support@avedatechnologies.com<br />
                Response Time: Under 12 hours
              </div>
            </section>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
