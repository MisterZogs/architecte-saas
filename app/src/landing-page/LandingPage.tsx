import FAQ from "./components/FAQ";
import FeaturesGrid from "./components/FeaturesGrid";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import ToolsSection from "./components/ToolsSection";
import { faqs, features, footerNavigation } from "./contentSections";
import WorkflowHighlight from "./ExampleHighlightedFeature";

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="isolate">
        <Hero />
        <ToolsSection />
        <WorkflowHighlight />
        <FeaturesGrid features={features} />
        <FAQ faqs={faqs} />
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}
