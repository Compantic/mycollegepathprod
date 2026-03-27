"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How do I verify my service status?",
    answer:
      "Verification is handled through our secure partner portal. Simply upload a digital copy of your service ID, DD214, or relevant documentation, and we'll process it within 24 hours.",
  },
  {
    question: "Does the discount apply to all subscription plans?",
    answer: "Yes. The 25% discount applies to Starter, Premium, and Elite plans.",
  },
  {
    question: "Can I combine this with other promotions?",
    answer: "The service discount cannot be combined with other percentage-based promotions, but it can be used with referral credits in most cases.",
  },
  {
    question: "How long does the discount last?",
    answer: "The discount applies for the lifetime of your subscription while you remain eligible.",
  },
  {
    question: "What if I am a former foster youth?",
    answer: "Former foster youth and adopted students are eligible. You may be asked to provide documentation from a recognized agency or program.",
  },
  {
    question: "Is my data secure during verification?",
    answer: "Yes. All documents are transmitted over encryption and stored securely. We do not share verification details with third parties.",
  },
];

export function DiscountFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="rounded-button border border-bg-border bg-bg-card overflow-hidden shadow-soft"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className={cn(
              "w-full flex items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-text-primary",
              "hover:bg-secondary-100/50 transition-colors"
            )}
            aria-expanded={openIndex === index}
          >
            {faq.question}
            {openIndex === index ? (
              <ChevronUp className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
            )}
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 pt-0">
              <p className="text-sm text-text-secondary leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
