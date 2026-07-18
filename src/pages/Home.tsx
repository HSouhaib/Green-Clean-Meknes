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
import { useSectionVisibility } from '@/hooks/useSectionVisibility';

interface HomeContentProps {
  isVisible: (key: string) => boolean;
}

function HomeContent({ isVisible }: HomeContentProps) {
  useScrollAnimation(0.2);

  return (
    <>
      <Navigation />
      <main>
        {isVisible('hero') && <HeroSection />}
        {isVisible('impact') && <ImpactSection />}
        {isVisible('about') && <AboutSection />}
        {isVisible('leaderboard') && <LeaderboardSection />}
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

export default function Home() {
  const { isVisible, isLoading } = useSectionVisibility();

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return <HomeContent isVisible={isVisible} />;
}
