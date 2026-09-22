import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "land-eye-kenya-frontend";

export const Faq = () => (
  <Accordion type="single" collapsible defaultValue="verify" className="w-96">
    <AccordionItem value="verify">
      <AccordionTrigger>How do you verify a title deed?</AccordionTrigger>
      <AccordionContent>
        We run an official search at the Ministry of Lands and match the registered owner, size and
        encumbrances against the seller's documents.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="fees">
      <AccordionTrigger>Are there listing fees?</AccordionTrigger>
      <AccordionContent>Your first listing is free. Agent plans start at KES 2,500/month.</AccordionContent>
    </AccordionItem>
    <AccordionItem value="visit">
      <AccordionTrigger>Can I visit a parcel before paying?</AccordionTrigger>
      <AccordionContent>Yes — book a site visit from the listing page.</AccordionContent>
    </AccordionItem>
  </Accordion>
);
