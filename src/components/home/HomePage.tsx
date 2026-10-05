import "./home.css";
import { CallToAction } from "./CallToAction";
import { Features } from "./Features";
import { HomeFooter } from "./HomeFooter";
import { HomeNavbar } from "./HomeNavbar";
import { Hero } from "./Hero";
import { Listings } from "./Listings";
import { ScrollStory } from "./ScrollStory";
import { Statement } from "./Statement";

export function HomePage() {
  return (
    <div className="geo-home">
      <HomeNavbar />
      <Hero />
      <ScrollStory />
      <Statement />
      <Listings />
      <Features />
      <CallToAction />
      <HomeFooter />
    </div>
  );
}
