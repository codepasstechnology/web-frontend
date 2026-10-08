import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/api";

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="gs-faq">
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <div key={faq.id} className="gs-faq-item">
            <h3>
              <button
                type="button"
                className="gs-faq-q"
                aria-expanded={open}
                aria-controls={`faq-${faq.id}`}
                onClick={() => setOpenId(open ? null : faq.id)}
              >
                {faq.question}
                <span className="gs-faq-chev">
                  <ChevronDown aria-hidden size={20} />
                </span>
              </button>
            </h3>
            {open && (
              <div
                id={`faq-${faq.id}`}
                className="gs-faq-a"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
