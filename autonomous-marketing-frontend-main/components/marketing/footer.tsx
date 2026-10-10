"use client";

import Link from "next/link";
import { useState } from "react";
import { submitPublicForm } from "@/lib/api/public-marketing";
import { ArrowRight, Mail } from "lucide-react";


export function Footer() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [website, setWebsite] = useState("");
  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault(); if (saving) return;
    setSaving(true); setFeedback(""); setFailed(false);
    try { await submitPublicForm("newsletter", { email, consent, website }); setFeedback("Your interest in product updates has been registered."); setEmail(""); }
    catch (error) { setFailed(true); setFeedback(error instanceof Error ? error.message : "Could not save your request."); }
    finally { setSaving(false); }
  };

  const groups = [
    { title: "Explore", links: [["Features & AI Core", "/features"], ["Examples & Showcase", "/examples"], ["Plans & Pricing", "/#pricing"], ["How It Works", "/#how-it-works"], ["About maeaco", "/#about"]] },
    { title: "Support", links: [["Contact Support", "/contact"], ["Getting Started", "/#how-it-works"], ["Sign In", "/login"]] },
    { title: "Legal", links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Data Deletion", "/data-deletion"], ["Refund Policy", "/refund-policy"]] },
  ];
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-inner">
        <div className="marketing-footer-top">
          <div className="marketing-footer-brand">
            <Link href="/" aria-label="maeaco home"><img src="/logo/website logo.png" alt="maeaco logo" width={2170} height={725} className="h-auto w-[180px] object-contain" /></Link>
            <p>One connected workspace for your business, your brand and your marketing.</p>
            <a href="mailto:support@avedatechnologies.com" className="marketing-footer-email"><Mail className="h-4 w-4 shrink-0" /><span>support@avedatechnologies.com</span></a>
          </div>
          <div className="marketing-footer-newsletter">
            <p className="marketing-eyebrow">Stay in the loop</p>
            <h2>Fresh ideas. Product updates.</h2>
            <p className="mt-2 text-sm text-zinc-600">Register your interest in marketing tips and maeaco updates.</p>
            <form onSubmit={subscribe} className="mt-5 space-y-3">
              <div className="marketing-newsletter-input-row">
                <input type="email" required maxLength={254} aria-label="Email for product updates" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" />
                <button type="submit" disabled={saving} className="marketing-action-primary" aria-label={saving ? "Saving subscription" : "Subscribe"}>{saving ? "Saving…" : "Subscribe"}<ArrowRight className="h-4 w-4" /></button>
              </div>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-zinc-600"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /><span>I agree to product updates. Read the <Link href="/privacy" className="underline">Privacy Policy</Link>.</span></label>
              <div hidden aria-hidden="true"><input aria-label="Website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
            </form>
            {feedback && <p role={failed ? "alert" : "status"} className={`mt-3 text-sm ${failed ? "text-red-700" : "text-emerald-700"}`}>{feedback}</p>}
          </div>
        </div>
        <nav aria-label="Footer" className="marketing-footer-links">
          {groups.map((group) => <div key={group.title}><h3>{group.title}</h3><ul>{group.links.map(([label, href]) => <li key={label}><Link href={href}>{label}</Link></li>)}</ul></div>)}
          <div className="marketing-footer-note"><span className="marketing-eyebrow">Your next campaign</span><p>Bring your catalogue.<br />Make it your brand.</p><Link href="/signup" className="marketing-footer-start">Get Started <ArrowRight className="h-4 w-4" /></Link></div>
        </nav>
        <div className="marketing-footer-bottom"><p>© {new Date().getFullYear()} maeaco. All rights reserved.</p><p>A product of <a href="https://www.avedatechnologies.com" target="_blank" rel="noopener noreferrer">Aveda Technologies</a></p></div>
      </div>
    </footer>
  );
}
