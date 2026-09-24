import { createFileRoute } from "@tanstack/react-router";
import { FaqSection } from "@/components/landing/FaqSection";
import { GuidesSection } from "@/components/landing/GuidesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { MarketplacesSection } from "@/components/landing/MarketplacesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { VerificationSection } from "@/components/landing/VerificationSection";
import { useBlogPosts, useFaqs } from "@/lib/content";
import { usePublicParcels } from "@/lib/parcels";
import { usePlans } from "@/lib/plans";
import { usePublicProperties } from "@/lib/properties";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: parcels = [] } = usePublicParcels();
  const { data: properties = [] } = usePublicProperties();
  const { data: plans = [] } = usePlans();
  const { data: faqs = [] } = useFaqs();
  const { data: posts = [] } = useBlogPosts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection parcels={parcels} />
      <MarketplacesSection parcels={parcels} properties={properties} />
      <VerificationSection />
      <PricingSection plans={plans} />
      <FaqSection faqs={faqs} />
      <GuidesSection posts={posts} />
      <LandingFooter />
    </div>
  );
}
