import CommunitySection from '@/sections/CommunitySection';
import Footer from '@/sections/Footer';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import Navigation from '@/sections/Navigation';
import HeroSection from '@/sections/HeroSection';
import AboutSection from '@/sections/AboutSection';
import HowToJoinSection from '@/sections/HowToJoinSection';
import CampaignsSection from '@/sections/CampaignsSection';
import ContactSection from '@/sections/ContactSection';
import DonationSection from '@/sections/DonationSection';
import ImpactSection from '@/sections/ImpactSection';
import AirQualitySection from '@/sections/AirQualitySection';
import NeighborhoodsSection from '@/sections/NeighborhoodsSection';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';

export default function Home() {
  useScrollAnimation(0.2);
  const { isVisible } = useSectionVisibility();

  return (
    <>
      <Navigation />
      <main>
        {isVisible('hero') && <HeroSection />}
        {isVisible('impact') && <ImpactSection />}
        {isVisible('about') && <AboutSection />}
        {isVisible('neighborhoods') && <NeighborhoodsSection />}
        <CommunitySection />
        {isVisible('airQuality') && <AirQualitySection />}
        {isVisible('howToJoin') && <HowToJoinSection />}
        {isVisible('campaigns') && <CampaignsSection />}
        {isVisible('contact') && <ContactSection />}
        {isVisible('donation') && <DonationSection />}
      </main>
      <Footer />
    </>
  );
}
