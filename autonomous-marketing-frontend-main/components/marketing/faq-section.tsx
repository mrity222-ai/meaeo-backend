"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How does the 14-day free trial work?",
    answer:
      "You get full access to maeaco's AI Marketing Engine for 14 days without entering credit card details. You can connect your social media handles, generate AI posts, and test auto-scheduling completely free.",
  },
  {
    question: "Can I use maeaco for multiple businesses or brands?",
    answer:
      "Yes! maeaco supports multi-brand management. Depending on your subscription plan (Starter, Premium, or Enterprise), you can add and manage multiple business profiles and social media accounts from a single dashboard.",
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
      "We support both INR (₹) and USD ($) billing via Razorpay and Stripe. You can pay using UPI, Debit/Credit Cards, Net Banking, Apple Pay, and international cards.",
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
    <section className="bg-[#FAF8FF] py-20 lg:py-28 text-zinc-900 border-t border-purple-100/70">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mx-auto max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-4 py-1.5 text-xs font-bold text-purple-700 uppercase tracking-widest mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
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
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-base font-semibold text-zinc-900 transition-colors hover:text-purple-700"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-purple-600 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-purple-50 px-6 pb-6 pt-3 text-sm text-zinc-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
