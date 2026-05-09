import { ArchitectureSection } from "../components/sections/ArchitectureSection";
import { FeatureSection } from "../components/sections/FeatureSection";
import { HeroSection } from "../components/sections/HeroSection";
import { ShowcaseSection } from "../components/sections/ShowcaseSection";

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeatureSection />
      <ArchitectureSection />
      <ShowcaseSection />
    </>
  );
}
