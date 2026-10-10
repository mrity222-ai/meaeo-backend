import { marketingMetadata } from "@/lib/marketing-metadata";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { ShieldCheck, Lock, Eye, FileText, Database, Server, Building2 } from "lucide-react";

export const metadata = marketingMetadata("/privacy", "Privacy Policy - maeaco by Aveda Technologies", "Privacy Policy and Data Protection guidelines for maeaco Autonomous AI Marketing System, a product of Aveda Technologies.");

export default function PrivacyPolicyPage() {
  return (
    <MarketingLayout>
      <MarketingPageHero label="Data Security & Compliance" title="Privacy Policy" description={<>Last updated: September 29, 2026. <strong>maeaco</strong> is a proprietary software product owned and operated by{" "}
              <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold underline">
                Aveda Technologies
              </a>.</>} />
      <div className="marketing-public-content bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">


          {/* Policy Content */}
          <div className="space-y-6 text-zinc-700 leading-relaxed text-sm lg:text-base">

            {/* Corporate Entity Notice */}
            <section className="rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-purple-900">
                <Building2 className="h-5 w-5 text-purple-600" />
                Corporate Ownership & Data Controller
              </h2>
              <p className="mt-3 text-purple-950">
                This Privacy Policy applies to all services, APIs, websites, and applications operating under the <strong>maeaco</strong> brand. <strong>maeaco</strong> is fully owned, developed, and operated by <strong>Aveda Technologies</strong> (<a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-purple-700">www.avedatechnologies.com</a>). References in this document to &quot;maeaco&quot;, &quot;Aveda Technologies&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot; refer to Aveda Technologies as the legal Data Controller.
              </p>
            </section>

            {/* Section 1 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <Database className="h-5 w-5 text-purple-600" />
                1. Information We Collect
              </h2>
              <p className="mt-3">
                When you register for or use the <strong>maeaco Autonomous Marketing System</strong> provided by Aveda Technologies, we collect information necessary to deliver autonomous marketing automation services:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-600">
                <li><strong>Account Credentials:</strong> Name, work email address, encrypted authentication password, and company details.</li>
                <li><strong>Connected Platform Profiles:</strong> OAuth 2.0 access tokens for integrated platforms including Google Business Profile, Facebook Pages, Instagram Business, and LinkedIn Pages.</li>
                <li><strong>Marketing Assets & Preferences:</strong> Business branding guidelines, uploaded brand logos, target audience profiles, campaign themes, and generated media assets.</li>
                <li><strong>System Usage & Diagnostics:</strong> IP addresses, browser types, API logs, and interaction timestamps for system security and diagnostic monitoring.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <Lock className="h-5 w-5 text-purple-600" />
                2. How We Encrypt & Protect Your Credentials
              </h2>
              <p className="mt-3">
                Security is architected into every layer of Aveda Technologies software. Platform access tokens and OAuth credentials are NEVER stored in plaintext.
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-600">
                <li>All OAuth tokens (Google, Meta, LinkedIn) are encrypted at rest using <strong>Fernet AES-256 symmetric encryption</strong>.</li>
                <li>Database sessions and API endpoints enforce TLS 1.3 encryption in transit.</li>
                <li>Tokens are scoped strictly to tenant isolation contexts, ensuring zero cross-tenant data exposure.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <Server className="h-5 w-5 text-purple-600" />
                3. Use of Third-Party AI Services
              </h2>
              <p className="mt-3">
                maeaco utilizes enterprise-tier AI models (Google Gemini 3.8/1.5, Hugging Face FLUX.1, Stability AI, and OpenAI GPT-4o) solely to generate marketing campaigns, captions, local offer posts, and review responses.
              </p>
              <p className="mt-2 text-zinc-600">
                Your business data is passed to these provider APIs strictly for instant execution. Aveda Technologies never sells your private data to data brokers, nor is your data used to train public foundation models.
              </p>
            </section>

            {/* Section 4 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <Eye className="h-5 w-5 text-purple-600" />
                4. Data Control & Deletion Rights
              </h2>
              <p className="mt-3">
                You retain complete ownership of your data and connected channels:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-zinc-600">
                <li>You can disconnect any social media channel or revoke OAuth permissions at any time via your <strong>Connections</strong> tab.</li>
                <li>You can request full account data deletion via our dedicated <a href="/data-deletion" className="text-purple-600 font-semibold underline">Data Deletion Page</a>.</li>
                <li>Upon account termination, all stored OAuth credentials, cached media assets, and campaign records are permanently purged within 30 days.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                <FileText className="h-5 w-5 text-purple-600" />
                5. Contact Aveda Technologies Privacy Team
              </h2>
              <p className="mt-3">
                If you have questions regarding this Privacy Policy or data security practices, please contact our Data Protection Team at:
              </p>
              <div className="mt-4 rounded-xl bg-purple-50 p-4 font-mono text-xs sm:text-sm text-purple-900 border border-purple-200">
                <strong>Aveda Technologies — Legal & Data Protection Division</strong><br />
                Official Website: <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">www.avedatechnologies.com</a><br />
                Privacy Email: privacy@avedatechnologies.com<br />
                Support Email: support@avedatechnologies.com
              </div>
            </section>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
