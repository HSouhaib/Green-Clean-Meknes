import { useLanguage } from '@/hooks/useLanguage';
import SectionLabel from '@/components/SectionLabel';
import StatCounter from '@/components/StatCounter';
import { trpc } from '@/lib/trpc';

export default function AboutSection() {
  const { t, dir } = useLanguage();
  const { data: stats } = trpc.campaign.stats.useQuery();

  const statCampaigns = stats?.campaigns ?? 1;
  const statVolunteers = stats?.volunteers ?? 0;
  const statNeighborhoods = stats?.neighborhoods ?? 0;

  return (
    <section
      id="about"
      className="relative"
      style={{ padding: 'var(--section-gap) 0' }}
    >
      <div
        className="mx-auto flex flex-col md:flex-row gap-12 md:gap-16 items-center"
        style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}
      >
        {/* Text column */}
        <div className="w-full md:w-[45%]" data-animate="fade-left">
          <SectionLabel text={t('about.label')} />

          <h2
            className="font-display mt-8 leading-[1.1]"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.5rem, 4vw, 3rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('about.heading')}
          </h2>

          <p
            className="font-light leading-[1.7] mt-8"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '16px',
              maxWidth: '440px',
            }}
          >
            {t('about.body')}
          </p>

          {/* Stats */}
          <div
            className="flex items-center gap-6 md:gap-8 mt-16"
            data-animate="fade-up"
            data-stagger="0.1"
          >
            <div data-animate="counter">
              <StatCounter end={statCampaigns} suffix="+" label={t('about.stat1.label')} />
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>|</span>
            <div data-animate="counter">
              <StatCounter end={statVolunteers} suffix="+" label={t('about.stat2.label')} />
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>|</span>
            <div data-animate="counter">
              <StatCounter end={statNeighborhoods} label={t('about.stat3.label')} />
            </div>
          </div>
        </div>

        {/* Image column */}
        <div className="w-full md:w-[55%]" data-animate="scale-in">
          <div
            className="rounded overflow-hidden"
            style={{
              marginLeft: dir === 'ltr' ? '-20px' : '0',
              marginRight: dir === 'rtl' ? '-20px' : '0',
              marginTop: '-20px',
              width: 'calc(100% + 40px)',
            }}
          >
            <img
              src="/assets/about-cleanup.jpg"
              alt="Volunteers cleaning a park in Meknes"
              className="w-full h-auto object-cover"
              style={{ minHeight: '400px', maxHeight: '550px' }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
