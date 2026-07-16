import { useLanguage } from '@/contexts/LanguageContext';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { trpc } from '@/providers/trpc';
import { Handshake, ExternalLink, Rss } from 'lucide-react';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>,
  tiktok: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>,
  facebook: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  twitter: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
};

const PLATFORM_LABELS: Record<string, Record<string, string>> = {
  en: { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', twitter: 'X' },
  fr: { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', twitter: 'X' },
  ar: { instagram: 'إنستغرام', tiktok: 'تيك توك', facebook: 'فيسبوك', twitter: 'إكس' },
};

export default function PartnersAndSocialSection() {
  const { t, lang } = useLanguage();
  const { isVisible } = useSectionVisibility();
  const { data: sponsors } = trpc.sponsor.list.useQuery();
  const { data: posts } = trpc.socialFeed.list.useQuery();

  const sponsorsVisible = isVisible('sponsors') && sponsors && sponsors.length > 0;
  const socialVisible = isVisible('socialFeed') && posts && posts.length > 0;

  if (!sponsorsVisible && !socialVisible) return null;

  const getLocalizedName = (s: NonNullable<typeof sponsors>[0]) => {
    if (lang === 'fr' && s.nameFr) return s.nameFr;
    if (lang === 'ar' && s.nameAr) return s.nameAr;
    return s.nameEn || s.name;
  };

  const sponsorTypeLabels: Record<string, Record<string, string>> = {
    en: { municipality: 'Municipality', ngo: 'NGO', business: 'Business', media: 'Media', other: 'Partner' },
    fr: { municipality: 'Municipalité', ngo: 'ONG', business: 'Entreprise', media: 'Média', other: 'Partenaire' },
    ar: { municipality: 'البلدية', ngo: 'منظمة', business: 'شركة', media: 'إعلام', other: 'شريك' },
  };

  const getCaption = (post: NonNullable<typeof posts>[0]) => {
    if (lang === 'fr' && post.captionFr) return post.captionFr;
    if (lang === 'ar' && post.captionAr) return post.captionAr;
    return post.captionEn || '';
  };

  return (
    <section id="partners-social" className="py-16 sm:py-20 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Two-column layout: Sponsors (left) + Social Feed (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column: Partners & Sponsors */}
          {sponsorsVisible && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-green)' }}>
                  {t('sponsors.label')}
                </span>
                <h2 className="font-display text-xl sm:text-2xl mt-1" style={{ color: 'var(--text-primary)' }}>
                  {t('sponsors.heading')}
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="group flex flex-col items-center text-center gap-2 p-3 rounded-xl transition-all duration-300 hover:scale-105"
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
                        <Handshake size={28} style={{ color: 'var(--text-tertiary)' }} />
                      )}
                      {sponsor.websiteUrl && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <ExternalLink size={16} className="text-white" />
                        </div>
                      )}
                    </a>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                        {sponsorTypeLabels[lang]?.[sponsor.sponsorType] || sponsorTypeLabels.en[sponsor.sponsorType] || sponsor.sponsorType}
                      </span>
                      <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {getLocalizedName(sponsor)}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Social Feed */}
          {socialVisible && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Rss size={16} style={{ color: 'var(--accent-green)' }} />
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-green)' }}>
                    {t('socialFeed.label')}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
                  {t('socialFeed.heading')}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {posts.slice(0, 4).map((post) => (
                  <a
                    key={post.id}
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg no-underline"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={getCaption(post)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-surface-light)' }}>
                          {PLATFORM_ICONS[post.platform] || <Rss size={24} style={{ color: 'var(--text-tertiary)' }} />}
                        </div>
                      )}
                      {/* Platform Badge */}
                      <div
                        className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
                      >
                        {PLATFORM_ICONS[post.platform] || <Rss size={10} />}
                        {PLATFORM_LABELS[lang]?.[post.platform] || post.platform}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-2.5">
                      {getCaption(post) && (
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                          {getCaption(post)}
                        </p>
                      )}
                      {post.authorName && (
                        <span className="text-[10px] font-medium mt-1 block" style={{ color: 'var(--text-secondary)' }}>
                          {post.authorName}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
