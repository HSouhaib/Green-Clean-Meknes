import { useMemo } from 'react';
import CommunitySection from '@/sections/CommunitySection';
import Footer from '@/sections/Footer';
import HomeSkeleton from '@/components/HomeSkeleton';
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
import LeaderboardSection from '@/sections/LeaderboardSection';
import NeighborhoodsSection from '@/sections/NeighborhoodsSection';
import { useSectionOrder } from '@/hooks/useSectionOrder';

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  hero: HeroSection,
  impact: ImpactSection,
  about: AboutSection,
  leaderboard: LeaderboardSection,
  neighborhoods: NeighborhoodsSection,
  community: CommunitySection,
  airQuality: AirQualitySection,
  howToJoin: HowToJoinSection,
  campaigns: CampaignsSection,
  contact: ContactSection,
  donation: DonationSection,
};

function HomeContent() {
  useScrollAnimation(0.2);
  const { orderedSections } = useSectionOrder();

  const sections = useMemo(() => {
    return orderedSections.map((key) => {
      const Component = SECTION_COMPONENTS[key];
      return Component ? <Component key={key} /> : null;
    });
  }, [orderedSections]);

  return (
    <>
      <Navigation />
      <main>{sections}</main>
      <Footer />
    </>
  );
}

export default function Home() {
  const { isLoading } = useSectionOrder();

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return <HomeContent />;
}
