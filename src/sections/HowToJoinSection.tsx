import { useLanguage } from '@/hooks/useLanguage';
import SectionLabel from '@/components/SectionLabel';
import VolunteerForm from '@/components/VolunteerForm';
import { Leaf, Users, Heart } from 'lucide-react';

export default function HowToJoinSection() {
  const { t } = useLanguage();

  return (
    <section
      id="join"
      style={{
        padding: 'var(--section-gap) 0',
        background: 'var(--bg-surface)',
      }}
    >
      <div
        className="mx-auto"
        style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}
      >
        {/* Intro */}
        <div className="text-center mb-16" data-animate="fade-up">
          <SectionLabel text={t('join.label')} />
          <h2
            className="font-display mt-4 leading-[1.1]"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('join.heading')}
          </h2>
        </div>

        {/* Two-column layout: Info + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Info cards */}
          <div className="space-y-4" data-stagger="0.1">
            {[
              {
                icon: <Leaf size={22} style={{ color: 'var(--accent-green-light)' }} />,
                title: t('join.card1.title'),
                body: t('join.card1.body'),
                cta: t('join.card1.cta'),
                href: '#campaigns',
              },
              {
                icon: <Users size={22} style={{ color: 'var(--accent-terracotta)' }} />,
                title: t('join.card2.title'),
                body: t('join.card2.body'),
                cta: t('join.card2.cta'),
                href: '#campaigns',
              },
              {
                icon: <Heart size={22} style={{ color: 'var(--accent-gold)' }} />,
                title: t('join.card3.title'),
                body: t('join.card3.body'),
                cta: t('join.card3.cta'),
                href: '#contact',
              },
            ].map((card, i) => (
              <div
                key={i}
                data-animate="fade-up"
                className="group flex items-start gap-4 rounded-xl p-5 transition-all duration-300"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-surface-light)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-green)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bg-surface-light)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-surface)' }}
                >
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {card.title}
                  </h3>
                  <p className="text-xs font-light leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {card.body}
                  </p>
                  <a
                    href={card.href}
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(card.href)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-medium mt-2 inline-flex items-center gap-1 transition-colors no-underline"
                    style={{ color: 'var(--accent-green-light)' }}
                  >
                    {card.cta}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Volunteer Form */}
          <div data-animate="fade-up" className="lg:sticky lg:top-24">
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-surface-light)',
              }}
            >
              {/* Form header */}
              <div className="text-center mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(107, 142, 90, 0.12)' }}
                >
                  <Leaf size={22} style={{ color: 'var(--accent-green)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {t('volunteer.form_title')}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {t('volunteer.form_subtitle')}
                </p>
              </div>

              <VolunteerForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
