import { Calculator } from "@/components/calculator/Calculator";
import { ParallaxBackground, ScrollProgress } from "@/components/ScrollFX";
import { Scene3D } from "@/components/Scene3D";
import { Footer, Header } from "@/components/SiteChrome";
import { Faq, Features, GstExplainer, Hero, HowItWorks, MarketplaceGuides, MetrionBridge } from "@/components/Sections";
import { HOME_SEO } from "@/content/seo";
import { buildJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata(HOME_SEO);

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(HOME_SEO)) }} />
      <ParallaxBackground />
      <Scene3D />
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <section className="wrap-wide py-10 sm:py-14" aria-label="Profit and loss calculator">
          <h2 className="sr-only">Free profit and loss calculator</h2>
          <Calculator />
        </section>
        <Features />
        <HowItWorks />
        <MarketplaceGuides />
        <GstExplainer />
        <MetrionBridge />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
