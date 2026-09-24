import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Faq } from "@/lib/api";

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;
  const shown = faqs.slice(0, 5);

  return (
    <section
      aria-labelledby="faq-title"
      className="mx-auto mt-20 flex max-w-[760px] flex-col gap-8 px-4 md:mt-[120px] md:px-8"
    >
      <h2
        id="faq-title"
        className="text-balance text-center text-[clamp(1.75rem,3.6vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.02em]"
      >
        Frequently asked questions
      </h2>
      <Accordion type="single" collapsible defaultValue={shown[0].id} className="w-full">
        {shown.map((f) => (
          <AccordionItem key={f.id} value={f.id}>
            <AccordionTrigger className="text-left text-base">{f.question}</AccordionTrigger>
            <AccordionContent className="text-[0.9375rem] leading-relaxed text-muted-foreground">
              {f.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
