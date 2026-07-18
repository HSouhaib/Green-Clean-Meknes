import { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { trpc } from '@/lib/trpc';
import { Camera, Handshake, Rss, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface PhotoPair {
  before: { imageUrl: string; captionEn?: string | null; captionFr?: string | null; captionAr?: string | null };
  after: { imageUrl: string; captionEn?: string | null; captionFr?: string | null; captionAr?: string | null };
}

type TabKey = 'gallery' | 'partners' | 'social';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>,
  tiktok: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>,
  facebook: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  twitter: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
};

const PLATFORM_LABELS: Record<string, Record<string, string>> = {
  en: { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', twitter: 'X' },
  fr: { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', twitter: 'X' },
  ar: { instagram: 'إنستغرام', tiktok: 'تيك توك', facebook: 'فيسبوك', twitter: 'إكس' },
};

export default function GalleryPartnersSocialSection() {
  const { t, lang } = useLanguage();
  const { isVisible } = useSectionVisibility();

  const { data: galleryData } = trpc.campaignPhoto.listByCampaign.useQuery();
  const { data: sponsors } = trpc.sponsor.list.useQuery();
  const { data: posts } = trpc.socialFeed.list.useQuery();

  const [activeTab, setActiveTab] = useState<TabKey>('gallery');
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [pairIndices, setPairIndices] = useState<Record<number, number>>({});

  const campaignGroups = useMemo(() => {
    if (!galleryData) return [];
    return galleryData.map((group) => {
      const pairs: PhotoPair[] = [];
      const maxPairs = Math.max(group.before.length, group.after.length);
      for (let i = 0; i < maxPairs; i++) {
        if (group.before[i] || group.after[i]) {
          pairs.push({
            before: group.before[i] || group.after[i],
            after: group.after[i] || group.before[i],
          });
        }
      }
      return { campaign: group.campaign, pairs };
    }).filter(g => g.pairs.length > 0);
  }, [galleryData]);

  const handlePrevCampaign = useCallback(() => {
    if (selectedCampaign === null) return;
    const idx = campaignGroups.findIndex(g => g.campaign.id === selectedCampaign);
    const prev = idx === 0 ? campaignGroups.length - 1 : idx - 1;
    setSelectedCampaign(campaignGroups[prev].campaign.id);
    setSelectedPairIndex(0);
  }, [selectedCampaign, campaignGroups]);

  const handleNextCampaign = useCallback(() => {
    if (selectedCampaign === null) return;
    const idx = campaignGroups.findIndex(g => g.campaign.id === selectedCampaign);
    const next = idx === campaignGroups.length - 1 ? 0 : idx + 1;
    setSelectedCampaign(campaignGroups[next].campaign.id);
    setSelectedPairIndex(0);
  }, [selectedCampaign, campaignGroups]);

  const galleryVisible = isVisible('gallery') && campaignGroups.length > 0;
  const sponsorsVisible = isVisible('sponsors') && sponsors && sponsors.length > 0;
  const socialVisible = isVisible('socialFeed') && posts && posts.length > 0;

  if (!galleryVisible && !sponsorsVisible && !socialVisible) return null;

  // Build available tabs
  const tabs = ([
    { key: 'gallery' as TabKey, label: t('gallery.label'), icon: <Camera size={14} />, visible: galleryVisible },
    { key: 'partners' as TabKey, label: t('sponsors.label'), icon: <Handshake size={14} />, visible: sponsorsVisible },
    { key: 'social' as TabKey, label: t('socialFeed.label'), icon: <Rss size={14} />, visible: socialVisible },
  ]).filter(t => t.visible);

  // If active tab is hidden, switch to first available
  const currentTab = tabs.find(t => t.key === activeTab) ? activeTab : tabs[0]?.key || 'gallery';

  const getCurrentPairIndex = (campaignId: number) => pairIndices[campaignId] ?? 0;
  const cyclePair = (campaignId: number, pairsLength: number) => {
    setPairIndices(prev => ({ ...prev, [campaignId]: ((prev[campaignId] ?? 0) + 1) % pairsLength }));
  };
  const getCaption = (item: { captionEn?: string | null; captionFr?: string | null; captionAr?: string | null }) => {
    if (lang === 'fr') return item.captionFr || item.captionEn;
    if (lang === 'ar') return item.captionAr || item.captionEn;
    return item.captionEn;
  };
  const getCampaignTitle = (campaign: { titleEn?: string | null; titleFr?: string | null; titleAr?: string | null }) => {
    if (lang === 'fr') return campaign.titleFr || campaign.titleEn;
    if (lang === 'ar') return campaign.titleAr || campaign.titleEn;
    return campaign.titleEn;
  };

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

  const getSocialCaption = (post: NonNullable<typeof posts>[0]) => {
    if (lang === 'fr' && post.captionFr) return post.captionFr;
    if (lang === 'ar' && post.captionAr) return post.captionAr;
    return post.captionEn || '';
  };

  const selectedGroup = campaignGroups.find(g => g.campaign.id === selectedCampaign);

  return (
    <section id="gallery-partners-social" className="py-16 sm:py-20 px-4" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            {t('gallery.heading')}
          </h2>
          <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('gallery.subheading')}
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full p-1 gap-1" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border-none"
                style={{
                  background: currentTab === tab.key ? 'var(--accent-green)' : 'transparent',
                  color: currentTab === tab.key ? 'white' : 'var(--text-secondary)',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Gallery Tab */}
          {currentTab === 'gallery' && galleryVisible && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaignGroups.map((group) => {
                const pairIdx = getCurrentPairIndex(group.campaign.id);
                const pair = group.pairs[pairIdx];
                const hasMultiplePairs = group.pairs.length > 1;
                return (
                  <div
                    key={group.campaign.id}
                    className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
                    onClick={() => { setSelectedCampaign(group.campaign.id); setSelectedPairIndex(pairIdx); }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden group">
                      <div className="absolute inset-0 w-1/2 overflow-hidden" style={{ borderRight: '2px solid var(--accent-green)' }}>
                        <img src={pair.before.imageUrl} alt={t('gallery.before')} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono uppercase" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>{t('gallery.before')}</div>
                      </div>
                      <div className="absolute inset-0 left-1/2 overflow-hidden">
                        <img src={pair.after.imageUrl} alt={t('gallery.after')} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono uppercase" style={{ background: 'var(--accent-green)', color: 'white' }}>{t('gallery.after')}</div>
                      </div>
                      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2" style={{ background: 'var(--accent-green)' }}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-green)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="15 18 9 12 15 6" /><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      </div>
                      {hasMultiplePairs && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); cyclePair(group.campaign.id, group.pairs.length); }} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                            <RefreshCw size={14} />
                          </button>
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                            {pairIdx + 1} / {group.pairs.length}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{getCampaignTitle(group.campaign)}</h3>
                      {hasMultiplePairs && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>{group.pairs.length} pairs</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Partners Tab */}
          {currentTab === 'partners' && sponsorsVisible && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="group flex flex-col items-center text-center gap-2 p-4 rounded-xl transition-all duration-300 hover:shadow-lg"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
                >
                  <a
                    href={sponsor.websiteUrl || '#'}
                    target={sponsor.websiteUrl ? '_blank' : undefined}
                    rel={sponsor.websiteUrl ? 'noopener noreferrer' : undefined}
                    className="relative w-full aspect-[3/2] flex items-center justify-center rounded-lg overflow-hidden"
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    {sponsor.logoUrl ? (
                      <img src={sponsor.logoUrl} alt={getLocalizedName(sponsor)} className="w-full h-full object-contain p-2" loading="lazy" />
                    ) : (
                      <Handshake size={28} style={{ color: 'var(--text-tertiary)' }} />
                    )}
                    {sponsor.websiteUrl && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <span className="text-white text-xs font-medium">Visit</span>
                      </div>
                    )}
                  </a>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                    {sponsorTypeLabels[lang]?.[sponsor.sponsorType] || sponsorTypeLabels.en[sponsor.sponsorType] || sponsor.sponsorType}
                  </span>
                  <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{getLocalizedName(sponsor)}</h3>
                </div>
              ))}
            </div>
          )}

          {/* Social Feed Tab */}
          {currentTab === 'social' && socialVisible && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {posts.map((post) => (
                <a
                  key={post.id}
                  href={post.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg no-underline"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt={getSocialCaption(post)} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                        {PLATFORM_ICONS[post.platform] || <Rss size={24} style={{ color: 'var(--text-tertiary)' }} />}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}>
                      {PLATFORM_ICONS[post.platform] || <Rss size={10} />}
                      {PLATFORM_LABELS[lang]?.[post.platform] || post.platform}
                    </div>
                  </div>
                  <div className="p-3">
                    {getSocialCaption(post) && (
                      <p className="text-xs line-clamp-2" style={{ color: 'var(--text-primary)' }}>{getSocialCaption(post)}</p>
                    )}
                    {post.authorName && (
                      <span className="text-[10px] font-medium mt-1 block" style={{ color: 'var(--text-secondary)' }}>{post.authorName}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedCampaign !== null && selectedGroup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedCampaign(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedCampaign(null)} className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
              <X size={20} />
            </button>
            {campaignGroups.length > 1 && (
              <>
                <button onClick={handlePrevCampaign} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNextCampaign} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {(() => {
              const pair = selectedGroup.pairs[selectedPairIndex] || selectedGroup.pairs[0];
              if (!pair) return null;
              return (
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <div className="absolute inset-0 w-1/2 overflow-hidden" style={{ borderRight: '2px solid var(--accent-green)' }}>
                      <img src={pair.before.imageUrl} alt={t('gallery.before')} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute bottom-4 left-4 px-3 py-1 rounded text-xs font-mono uppercase" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>{t('gallery.before')}</div>
                    </div>
                    <div className="absolute inset-0 left-1/2 overflow-hidden">
                      <img src={pair.after.imageUrl} alt={t('gallery.after')} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute bottom-4 right-4 px-3 py-1 rounded text-xs font-mono uppercase" style={{ background: 'var(--accent-green)', color: 'white' }}>{t('gallery.after')}</div>
                    </div>
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2" style={{ background: 'var(--accent-green)' }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-green)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="15 18 9 12 15 6" /><polyline points="9 18 15 12 9 6" /></svg>
                      </div>
                    </div>
                    {selectedGroup.pairs.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        <button onClick={() => setSelectedPairIndex(i => i === 0 ? selectedGroup.pairs.length - 1 : i - 1)} className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>{selectedPairIndex + 1} / {selectedGroup.pairs.length}</span>
                        <button onClick={() => setSelectedPairIndex(i => i === selectedGroup.pairs.length - 1 ? 0 : i + 1)} className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{getCampaignTitle(selectedGroup.campaign)}</h3>
                    {(getCaption(pair.before) || getCaption(pair.after)) && (
                      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{getCaption(pair.after) || getCaption(pair.before)}</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
