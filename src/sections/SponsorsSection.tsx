// useState imported for future use
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { trpc } from '@/lib/trpc';
import { Handshake, ExternalLink } from 'lucide-react';

export default function SponsorsSection() {
  const { t, lang } = useLanguage();
  const { isVisible } = useSectionVisibility();
  const { data: sponsors } = trpc.sponsor.list.useQuery();

  if (!isVisible('sponsors')) return null;
  if (!sponsors || sponsors.length === 0) return null;

  const getLocalizedName = (s: typeof sponsors[0]) => {
    if (lang === 'fr' && s.nameFr) return s.nameFr;
    if (lang === 'ar' && s.nameAr) return s.nameAr;
    return s.nameEn || s.name;
  };

  const getLocalizedDescription = (s: typeof sponsors[0]) => {
    if (lang === 'fr' && s.descriptionFr) return s.descriptionFr;
    if (lang === 'ar' && s.descriptionAr) return s.descriptionAr;
    return s.descriptionEn || '';
  };

  const sponsorTypeLabels: Record<string, Record<string, string>> = {
    en: { municipality: 'Municipality', ngo: 'NGO', business: 'Business', media: 'Media', other: 'Partner' },
    fr: { municipality: 'Municipalité', ngo: 'ONG', business: 'Entreprise', media: 'Média', other: 'Partenaire' },
    ar: { municipality: 'البلدية', ngo: 'منظمة', business: 'شركة', media: 'إعلام', other: 'شريك' },
  };

  return (
    <section id="sponsors" className="py-16 sm:py-20 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-green)' }}>
            {t('sponsors.label')}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl mt-2" style={{ color: 'var(--text-primary)' }}>
            {t('sponsors.heading')}
          </h2>
          <p className="mt-2 text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('sponsors.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="group flex flex-col items-center text-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--bg-surface)' }}
            >
              <a
                href={sponsor.websiteUrl || '#'}
                target={sponsor.websiteUrl ? '_blank' : undefined}
                rel={sponsor.websiteUrl ? 'noopener noreferrer' : undefined}
                className="relative w-full aspect-[3/2] flex items-center justify-center rounded-lg overflow-hidden"
                style={{ background: 'var(--bg-primary)' }}
              >
                {sponsor.logoUrl ? (
                  <img
                    src={sponsor.logoUrl}
                    alt={getLocalizedName(sponsor)}
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                  />
                ) : (
                  <Handshake size={32} style={{ color: 'var(--text-tertiary)' }} />
                )}
                {sponsor.websiteUrl && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <ExternalLink size={20} className="text-white" />
                  </div>
                )}
              </a>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                  {sponsorTypeLabels[lang]?.[sponsor.sponsorType] || sponsorTypeLabels.en[sponsor.sponsorType] || sponsor.sponsorType}
                </span>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {getLocalizedName(sponsor)}
                </h3>
                {getLocalizedDescription(sponsor) && (
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                    {getLocalizedDescription(sponsor)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
