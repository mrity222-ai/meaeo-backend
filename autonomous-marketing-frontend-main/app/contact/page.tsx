"use client";

import { submitPublicForm } from "@/lib/api/public-marketing";
import { useState } from "react";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Mail, MapPin, MessageSquare, Send, CheckCircle2, Clock, Globe, Building2 } from "lucide-react";

export default function ContactUsPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (saving) return;
    setSaving(true); setError("");
    try {
      const result = await submitPublicForm<{ reference: string }>("contact", { ...formData, consent, website });
      setReference(result.reference); setSubmitted(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save your message."); }
    finally { setSaving(false); }
  };

  return (
    <MarketingLayout>
      <MarketingPageHero label="Get in Touch" title="Contact Support & Sales" description={<>Have a question about <strong>maeaco</strong> AI marketing automation, enterprise setups, or billing? Contact the team at{" "}
              <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold underline">
                Aveda Technologies
              </a>.</>} />
      <div className="marketing-public-content bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">



          <div className="grid gap-8 lg:grid-cols-12">

            {/* Contact Info Cards */}
            <div className="lg:col-span-5 space-y-6">

              <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Parent Company</h3>
                    <p className="mt-1 text-xs text-zinc-500">maeaco is developed & owned by</p>
                    <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:underline">
                      <span>Aveda Technologies</span>
                      <Globe className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Official Support Emails</h3>
                    <p className="mt-1 text-xs text-zinc-500">Technical & billing enquiries</p>
                    <div className="mt-1 space-y-0.5 text-xs sm:text-sm font-semibold text-purple-600">
                      <div>Support: <a href="mailto:support@avedatechnologies.com" className="hover:underline">support@avedatechnologies.com</a></div>
                      <div>Billing: <a href="mailto:billing@avedatechnologies.com" className="hover:underline">billing@avedatechnologies.com</a></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Response Hours</h3>
                    <p className="mt-1 text-xs text-zinc-500">Monday – Saturday</p>
                    <p className="mt-1 text-sm font-medium text-zinc-800">9:00 AM – 8:00 PM IST</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Corporate Headquarters</h3>
                    <p className="mt-1 text-xs text-zinc-500">Aveda Technologies HQ</p>
                    <p className="mt-1 text-sm text-zinc-700">Aveda Technologies Corporate Division, India</p>
                    <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-purple-600 hover:underline">
                      www.avedatechnologies.com
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-purple-100 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-zinc-900">Send us a Message</h2>
                <p className="mt-1 text-xs text-zinc-500">Fill in the details below and the Aveda Technologies support team will get back to you promptly.</p>

                {submitted ? (
                  <div role="status" className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                    <h3 className="mt-3 text-lg font-bold">Message Received!</h3>
                    <p className="mt-1 text-xs text-emerald-700">Thank you for reaching out. Your enquiry has been saved with reference <strong>{reference}</strong>. Contact <a href="mailto:support@avedatechnologies.com" className="underline">support@avedatechnologies.com</a> for urgent assistance.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-wider text-zinc-700">Your Name</label>
                      <input
                        type="text"
                        required
                        id="contact-name"
                        maxLength={120}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-purple-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider text-zinc-700">Work Email</label>
                      <input
                        type="email"
                        required
                        id="contact-email"
                        maxLength={254}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@company.com"
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-purple-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-xs font-bold uppercase tracking-wider text-zinc-700">Subject</label>
                      <select
                        id="contact-subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-purple-600 focus:outline-none"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Billing & Refund">Billing & Refund</option>
                        <option value="Enterprise Sales">Enterprise Sales</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider text-zinc-700">Message</label>
                      <textarea
                        required
                        rows={4}
                        minLength={10}
                        id="contact-message"
                        maxLength={5000}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="How can Aveda Technologies help your business?"
                        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-purple-600 focus:outline-none"
                      />
                    </div>

                    <label className="flex items-start gap-2 text-xs text-zinc-600"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />I agree to be contacted about this enquiry. See our <a href="/privacy" className="underline">Privacy Policy</a>.</label>
                    <div hidden aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
                    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                    <button
                      disabled={saving}
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20"
                    >
                      <Send className="h-4 w-4" />
                      <span>{saving ? "Saving…" : "Send Message"}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
