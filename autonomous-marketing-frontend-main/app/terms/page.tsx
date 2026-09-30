import { MarketingLayout } from "@/components/layout/marketing-layout";
import { FileCheck, ShieldAlert, CreditCard, Scale, CheckCircle2, Building2 } from "lucide-react";

export const metadata = {
  title: "Terms of Service - maeaco by Aveda Technologies",
  description: "Terms of Service and Acceptable Use Policy for maeaco Autonomous AI Marketing System, a product of Aveda Technologies.",
};

export default function TermsOfServicePage() {
  return (
    <MarketingLayout>
      <div className="bg-gradient-to-b from-purple-50/50 to-white py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              <FileCheck className="h-4 w-4" />
              <span>Legal Agreement</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-base text-zinc-600">
              Effective Date: September 29, 2026. <strong>maeaco</strong> is owned and operated by{" "}
              <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold underline">
                Aveda Technologies
              </a>.
            </p>
          </div>

          {/* Policy Content */}
          <div className="mt-12 space-y-10 text-zinc-700 leading-relaxed text-sm lg:text-base">

            {/* Corporate Entity Notice */}
            <section className="rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-purple-900">
                <Building2 className="h-5 w-5 text-purple-600" />
                Legal Entity Statement
              </h2>
              <p className="mt-3 text-purple-950">
                These Terms of Service constitute a legally binding agreement between you and <strong>Aveda Technologies</strong> (<a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-purple-700">www.avedatechnologies.com</a>), governing your access to and use of the <strong>maeaco</strong> software platform, APIs, and associated marketing automation services.
              </p>
            </section>

            {/* Section 1 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                1. Acceptance of Terms
              </h2>
              <p className="mt-3">
                By creating an account, accessing, or utilizing the <strong>maeaco Autonomous Marketing System</strong> provided by Aveda Technologies, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or legal entity, you represent that you have authority to bind such entity.
              </p>
            </section>

            {/* Section 2 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <Scale className="h-5 w-5 text-purple-600" />
                2. Scope of Service & Platform Connections
              </h2>
              <p className="mt-3">
                maeaco provides AI-driven content generation, campaign automation, review management, and multi-channel publishing across integrated third-party platforms (Google Business Profile, Meta / Facebook / Instagram, LinkedIn).
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-600">
                <li>You maintain sole responsibility for maintaining active, authorized third-party platform credentials.</li>
                <li>maeaco operates strictly within the API quotas, guidelines, and terms imposed by third-party platforms (Google APIs, Meta Graph API, LinkedIn API).</li>
                <li>Aveda Technologies is not liable for service interruptions caused by third-party platform policy changes or API downtime.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <ShieldAlert className="h-5 w-5 text-purple-600" />
                3. Acceptable Use & Content Standards
              </h2>
              <p className="mt-3">
                You agree not to use maeaco to generate, schedule, or publish any of the following prohibited content:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-600">
                <li>Deceptive, fraudulent, defamatory, or unlawful promotional material.</li>
                <li>Spamming, automated harassment, or bulk unauthorized posting.</li>
                <li>Content violating third-party intellectual property or copyright laws.</li>
                <li>Malicious code, exploits, or attempts to disrupt system security or multi-tenant isolation.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <CreditCard className="h-5 w-5 text-purple-600" />
                4. Subscription, Payments & Merchant Billing
              </h2>
              <p className="mt-3">
                Subscriptions are processed via authorized payment gateway partners (Razorpay / Stripe) on behalf of merchant entity <strong>Aveda Technologies</strong>.
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-600">
                <li>Charges on your credit card or bank account statement will appear as <strong>&quot;AVEDA TECHNOLOGIES&quot;</strong> or <strong>&quot;MAEACO BY AVEDA&quot;</strong>.</li>
                <li>Fees are billed at the beginning of each billing cycle based on your selected plan.</li>
                <li>You may upgrade, downgrade, or cancel your subscription at any time via the Subscription tab in your dashboard.</li>
                <li>For details regarding refunds, please consult our <a href="/refund-policy" className="text-purple-600 font-semibold underline">Refund Policy</a>.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <FileCheck className="h-5 w-5 text-purple-600" />
                5. Limitation of Liability
              </h2>
              <p className="mt-3">
                To the maximum extent permitted by applicable law, Aveda Technologies and its officers, directors, and employees shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
              </p>
            </section>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
