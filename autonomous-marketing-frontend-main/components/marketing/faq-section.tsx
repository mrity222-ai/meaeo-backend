"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How do I get started?",
    answer:
      "Create an account, set up your business profile and review the available plans. Premium starts at ₹999/month. The current plan limits are shown in Pricing and confirmed at checkout.",
  },
  {
    question: "Can I use maeaco for multiple businesses or brands?",
    answer:
      "Yes! maeaco supports multi-brand management. Depending on your subscription plan (Basic, Premium, or Enterprise), you can add and manage multiple business profiles and social media accounts from a single dashboard.",
  },
  {
    question: "How does the AI generate branded images and captions?",
    answer:
      "When you set up your business profile, our Brand Asset Agent saves your logo, brand colors, phone number, and address. For every daily post, AI generates a relevant image, writes high-converting captions, and automatically overlays your logo and contact details.",
  },
  {
    question: "How does Google Review Auto-Responder work?",
    answer:
      "maeaco connects to your Google Business Profile via official Google API. Whenever a customer leaves a rating or review on Google Maps or Search, our AI Review Agent automatically analyzes the sentiment and posts a polite, professional reply 24/7.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "Payments are handled through Razorpay. Available methods, such as UPI, cards and net banking, are shown at checkout. The checkout amount and currency are authoritative.",
  },
  {
    question: "Can I review or edit posts before they are published?",
    answer:
      "Yes! You can toggle between Autonomous Mode (fully automated publishing) and Human Intervention Mode (requires your approval click in the campaign calendar before going live).",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((current) => (current === idx ? null : idx));
  };

  return (
    <section id="faq" className="bg-[#FAF8FF] py-20 lg:py-28 text-zinc-900 border-t border-purple-100/70">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="marketing-section-intro marketing-section-spaced">
          <div className="marketing-eyebrow">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="marketing-section-title">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-zinc-500 font-normal">
            Everything you need to know about maeaco AI marketing automation.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-purple-100 bg-white transition-all shadow-sm hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-base font-semibold text-zinc-900 transition-colors hover:text-purple-700"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-purple-600 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div id={`faq-answer-${idx}`} role="region" aria-labelledby={`faq-question-${idx}`} inert={!isOpen} className={`marketing-accordion ${isOpen ? "is-open" : ""}`}>
                  <div className="overflow-hidden"><p className="border-t border-purple-50 px-6 pb-6 pt-3 text-sm text-zinc-600 leading-relaxed">{faq.answer}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
