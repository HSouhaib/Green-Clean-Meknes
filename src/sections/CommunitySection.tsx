import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Handshake, Rss, Quote, Vote, HelpCircle,
  X, ChevronLeft, ChevronRight, RefreshCw, ChevronDown,
  BarChart3, CheckCircle2,
} from 'lucide-react';

/* ─── Types ─── */
interface PhotoPair {
  before: { imageUrl: string; captionEn?: string | null; captionFr?: string | null; captionAr?: string | null };
  after: { imageUrl: string; captionEn?: string | null; captionFr?: string | null; captionAr?: string | null };
}

type TabKey = 'gallery' | 'partners' | 'social' | 'testimonials' | 'poll' | 'faq';

interface PollOption { text: string; textAr: string; textFr: string; }

const POLL_VOTE_KEY = 'meknes_poll_voted';

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

function getPollOptions(t: (key: string) => string): PollOption[] {
  return [
    { text: t('poll.option_1'), textAr: 'المدينة القديمة', textFr: 'La Médina' },
    { text: t('poll.option_2'), textAr: 'ساحة الحديم', textFr: 'Place el-Hedim' },
    { text: t('poll.option_3'), textAr: 'ضفاف نهر فرت', textFr: 'Bords de la rivière Fert' },
    { text: t('poll.option_4'), textAr: 'الأحياء السكنية', textFr: 'Quartiers résidentiels' },
    { text: t('poll.option_5'), textAr: 'الحدائق العامة', textFr: 'Parcs publics' },
  ];
}

/* ─── Empty State ─── */
function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: 'var(--text-secondary)' }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }}>{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ─── Tab: Gallery ─── */
function GalleryTab({ t, lang }: { t: (k: string) => string; lang: string }) {
  const { data: galleryData } = trpc.campaignPhoto.listByCampaign.useQuery();
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
          pairs.push({ before: group.before[i] || group.after[i], after: group.after[i] || group.before[i] });
        }
      }
      return { campaign: group.campaign, pairs };
    }).filter(g => g.pairs.length > 0);
  }, [galleryData]);

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

  const selectedGroup = campaignGroups.find(g => g.campaign.id === selectedCampaign);

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

  if (campaignGroups.length === 0) return <EmptyState message={t('gallery.empty')} icon={<Camera size={32} />} />;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaignGroups.map((group) => {
          const pairIdx = getCurrentPairIndex(group.campaign.id);
          const pair = group.pairs[pairIdx];
          const hasMultiplePairs = group.pairs.length > 1;
          return (
            <div key={group.campaign.id} className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }} onClick={() => { setSelectedCampaign(group.campaign.id); setSelectedPairIndex(pairIdx); }}>
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
                    <button onClick={(e) => { e.stopPropagation(); cyclePair(group.campaign.id, group.pairs.length); }} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}><RefreshCw size={14} /></button>
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>{pairIdx + 1} / {group.pairs.length}</div>
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

      {selectedCampaign !== null && selectedGroup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedCampaign(null)}>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedCampaign(null)} className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}><X size={20} /></button>
            {campaignGroups.length > 1 && (
              <>
                <button onClick={handlePrevCampaign} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}><ChevronLeft size={20} /></button>
                <button onClick={handleNextCampaign} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}><ChevronRight size={20} /></button>
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
                        <button onClick={() => setSelectedPairIndex(i => i === 0 ? selectedGroup.pairs.length - 1 : i - 1)} className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}><ChevronLeft size={16} /></button>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>{selectedPairIndex + 1} / {selectedGroup.pairs.length}</span>
                        <button onClick={() => setSelectedPairIndex(i => i === selectedGroup.pairs.length - 1 ? 0 : i + 1)} className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}><ChevronRight size={16} /></button>
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
    </>
  );
}

/* ─── Tab: Partners ─── */
function PartnersTab({ t, lang }: { t: (k: string) => string; lang: string }) {
  const { data: sponsors } = trpc.sponsor.list.useQuery();
  if (!sponsors || sponsors.length === 0) return <EmptyState message={t('partners.empty')} icon={<Handshake size={32} />} />;

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {sponsors.map((sponsor) => (
        <div key={sponsor.id} className="group flex flex-col items-center text-center gap-2 p-4 rounded-xl transition-all duration-300 hover:shadow-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}>
          <a href={sponsor.websiteUrl || '#'} target={sponsor.websiteUrl ? '_blank' : undefined} rel={sponsor.websiteUrl ? 'noopener noreferrer' : undefined} className="relative w-full aspect-[3/2] flex items-center justify-center rounded-lg overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
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
  );
}

/* ─── Tab: Social ─── */
function SocialTab({ t, lang }: { t: (k: string) => string; lang: string }) {
  const { data: posts } = trpc.socialFeed.list.useQuery();
  if (!posts || posts.length === 0) return <EmptyState message={t('socialFeed.empty')} icon={<Rss size={32} />} />;

  const getSocialCaption = (post: NonNullable<typeof posts>[0]) => {
    if (lang === 'fr' && post.captionFr) return post.captionFr;
    if (lang === 'ar' && post.captionAr) return post.captionAr;
    return post.captionEn || '';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {posts.map((post) => (
        <a key={post.id} href={post.postUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg no-underline" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}>
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
            {getSocialCaption(post) && <p className="text-xs line-clamp-2" style={{ color: 'var(--text-primary)' }}>{getSocialCaption(post)}</p>}
            {post.authorName && <span className="text-[10px] font-medium mt-1 block" style={{ color: 'var(--text-secondary)' }}>{post.authorName}</span>}
          </div>
        </a>
      ))}
    </div>
  );
}

/* ─── Tab: Testimonials ─── */
function TestimonialsTab({ t, lang }: { t: (k: string) => string; lang: string }) {
  const { data: testimonials } = trpc.testimonial.list.useQuery();
  const activeTestimonials = testimonials?.filter((t) => t.isActive) ?? [];
  const [tIndex, setTIndex] = useState(0);
  const [tPaused, setTPaused] = useState(false);

  const getQuote = (testimonial: typeof activeTestimonials[0]) => {
    if (lang === 'ar' && testimonial.quoteAr) return testimonial.quoteAr;
    if (lang === 'fr' && testimonial.quoteFr) return testimonial.quoteFr;
    return testimonial.quoteEn;
  };
  const getName = (testimonial: typeof activeTestimonials[0]) => {
    if (lang === 'ar' && testimonial.nameAr) return testimonial.nameAr;
    if (lang === 'fr' && testimonial.nameFr) return testimonial.nameFr;
    return testimonial.name;
  };
  const getRole = (testimonial: typeof activeTestimonials[0]) => {
    if (lang === 'ar' && testimonial.roleAr) return testimonial.roleAr;
    if (lang === 'fr' && testimonial.roleFr) return testimonial.roleFr;
    return testimonial.role;
  };

  const tNext = useCallback(() => setTIndex((prev) => (prev + 1) % activeTestimonials.length), [activeTestimonials.length]);
  const tPrev = useCallback(() => setTIndex((prev) => (prev - 1 + activeTestimonials.length) % activeTestimonials.length), [activeTestimonials.length]);

  useEffect(() => {
    if (tPaused || activeTestimonials.length <= 1) return;
    const interval = setInterval(tNext, 6000);
    return () => clearInterval(interval);
  }, [tPaused, activeTestimonials.length, tNext]);

  if (activeTestimonials.length === 0) return <EmptyState message={t('testimonials.empty')} icon={<Quote size={32} />} />;

  const total = activeTestimonials.length;
  const visibleCount = Math.min(total, 3);
  const indices = [];
  for (let i = 0; i < visibleCount; i++) indices.push((tIndex + i) % total);

  return (
    <div onMouseEnter={() => setTPaused(true)} onMouseLeave={() => setTPaused(false)} onTouchStart={() => setTPaused(true)} onTouchEnd={() => setTPaused(false)}>
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {indices.map((idx) => {
            const testimonial = activeTestimonials[idx];
            return (
              <div key={testimonial.id} className="flex flex-col items-center text-center p-6 rounded-xl transition-all duration-500" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}>
                <Quote size={24} strokeWidth={1} style={{ color: 'var(--accent-green-light)', opacity: 0.5 }} className="mb-4" />
                <p className="text-sm font-light leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>&ldquo;{getQuote(testimonial)}&rdquo;</p>
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}>
                    {getName(testimonial).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{getName(testimonial)}</div>
                    <div className="text-xs font-light" style={{ color: 'var(--text-tertiary)' }}>{getRole(testimonial)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {total > 3 && (
          <>
            <button onClick={tPrev} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 items-center justify-center rounded-full border-none cursor-pointer" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-primary)' }} aria-label="Previous"><ChevronLeft size={20} /></button>
            <button onClick={tNext} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 items-center justify-center rounded-full border-none cursor-pointer" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-primary)' }} aria-label="Next"><ChevronRight size={20} /></button>
          </>
        )}
        {total > 3 && (
          <div className="flex justify-center gap-3 mt-6">
            {activeTestimonials.map((_, idx) => (
              <button key={idx} onClick={() => setTIndex(idx)} className="rounded-full transition-all duration-300 border-none cursor-pointer flex items-center justify-center" style={{ width: '24px', height: '24px', background: idx === tIndex ? 'var(--accent-green-light)' : 'var(--bg-surface-light)', opacity: idx === tIndex ? 1 : 0.5 }} aria-label={`Go to testimonial ${idx + 1}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Tab: Poll ─── */
function PollTab({ t, lang }: { t: (k: string) => string; lang: string }) {
  const { showError } = useErrorModal();
  const { data: poll } = trpc.poll.getActive.useQuery();
  const { data: results, refetch: refetchResults } = trpc.poll.getResults.useQuery(
    { pollId: poll?.id ?? 0 },
    { enabled: false }
  );
  const [hasVoted, setHasVoted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(POLL_VOTE_KEY) !== null;
  });
  const [votedOption, setVotedOption] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(POLL_VOTE_KEY);
    return saved !== null ? parseInt(saved, 10) : null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<HTMLDivElement>(null);

  const pollOptions = getPollOptions(t);
  const totalVotes = results?.totalVotes ?? 0;
  const getOptionText = (opt: PollOption) => {
    if (lang === 'ar') return opt.textAr;
    if (lang === 'fr') return opt.textFr;
    return opt.text;
  };

  const voteMutation = trpc.poll.vote.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setHasVoted(true);
        if (votedOption !== null) localStorage.setItem(POLL_VOTE_KEY, String(votedOption));
        toast.success(t('toast.vote_cast'));
      } else if (data.message === 'Already voted') {
        toast.info(t('toast.vote_already'));
      } else {
        showError(data.message || t('toast.error_generic'));
      }
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const handleVote = (optionIndex: number) => {
    if (!poll || hasVoted || isSubmitting) return;
    setVotedOption(optionIndex);
    setIsSubmitting(true);
    voteMutation.mutate({ pollId: poll.id, optionIndex }, { onSettled: () => { setIsSubmitting(false); refetchResults(); } });
  };

  if (!poll) return <EmptyState message={t('poll.no_active')} icon={<Vote size={32} />} />;

  return (
    <div ref={pollRef} className="max-w-2xl mx-auto p-6 rounded-2xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}>
      {!hasVoted ? (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Vote size={20} style={{ color: 'var(--accent-green)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('poll.question')}</span>
          </div>
          <div className="space-y-3">
            {pollOptions.map((opt, i) => (
              <button key={i} onClick={() => handleVote(i)} disabled={isSubmitting} className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:opacity-90 disabled:opacity-50 cursor-pointer border-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)', color: 'var(--text-primary)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--accent-green)' }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-green)', opacity: 0 }} />
                  </div>
                  <span className="text-sm">{getOptionText(opt)}</span>
                </div>
              </button>
            ))}
          </div>
          {isSubmitting && (
            <div className="flex items-center justify-center mt-4">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-green)', borderTopColor: 'transparent' }} />
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={20} style={{ color: 'var(--accent-green)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('poll.results')}</span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>{totalVotes} {t('poll.votes')}</span>
          </div>
          <div className="space-y-4">
            {pollOptions.map((opt, i) => {
              const count = results?.counts?.[i] ?? 0;
              const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isSelected = votedOption === i;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      {isSelected && <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />}
                      {getOptionText(opt)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{percentage}% ({count})</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-light)' }}>
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${percentage}%`, background: isSelected ? 'var(--accent-green)' : 'var(--accent-terracotta)' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('poll.thanks')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: FAQ ─── */
function FaqTab({ t, lang }: { t: (k: string) => string; lang: string }) {
  const { data: faqs, isLoading: faqsLoading } = trpc.faq.list.useQuery();
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const { dir } = useLanguage();

  const getFaqQuestion = (faq: { questionEn: string; questionFr: string | null; questionAr: string | null }) => {
    if (lang === 'fr' && faq.questionFr) return faq.questionFr;
    if (lang === 'ar' && faq.questionAr) return faq.questionAr;
    return faq.questionEn;
  };
  const getFaqAnswer = (faq: { answerEn: string; answerFr: string | null; answerAr: string | null }) => {
    if (lang === 'fr' && faq.answerFr) return faq.answerFr;
    if (lang === 'ar' && faq.answerAr) return faq.answerAr;
    return faq.answerEn;
  };

  if (!faqs || faqs.length === 0) return <EmptyState message={t('faq.empty')} icon={<HelpCircle size={32} />} />;

  return (
    <div className="max-w-3xl mx-auto space-y-3" dir={dir}>
      {faqsLoading ? (
        <div className="animate-pulse h-32 rounded-lg" style={{ background: 'var(--bg-primary)' }} />
      ) : (
        faqs.map((faq, index) => {
          const isOpen = openFaqId === faq.id;
          return (
            <motion.div key={faq.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.4 }} className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}>
              <button onClick={() => setOpenFaqId(isOpen ? null : faq.id)} className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-200 hover:opacity-90 cursor-pointer border-none" style={{ background: isOpen ? 'rgba(107, 142, 90, 0.08)' : 'transparent' }}>
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(107, 142, 90, 0.15)' }}>
                  <HelpCircle size={16} style={{ color: 'var(--accent-green)' }} />
                </div>
                <span className="flex-1 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{getFaqQuestion(faq)}</span>
                <ChevronDown size={18} style={{ color: 'var(--text-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', flexShrink: 0 }} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                    <div className="px-5 pb-4 pl-[52px]" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
                      {getFaqAnswer(faq)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

/* ─── Main Community Section ─── */
export default function CommunitySection() {
  const { t, lang } = useLanguage();
  const { isVisible } = useSectionVisibility();
  const [activeTab, setActiveTab] = useState<TabKey>('gallery');

  const galleryVisible = isVisible('gallery');
  const sponsorsVisible = isVisible('sponsors');
  const socialVisible = isVisible('socialFeed');
  const testimonialsVisible = isVisible('testimonials');
  const pollVisible = isVisible('poll');
  const faqVisible = isVisible('faq');

  const allTabs = [
    { key: 'gallery' as TabKey, label: t('gallery.label'), icon: <Camera size={14} />, enabled: galleryVisible },
    { key: 'partners' as TabKey, label: t('sponsors.label'), icon: <Handshake size={14} />, enabled: sponsorsVisible },
    { key: 'social' as TabKey, label: t('socialFeed.label'), icon: <Rss size={14} />, enabled: socialVisible },
    { key: 'testimonials' as TabKey, label: t('testimonials.label'), icon: <Quote size={14} />, enabled: testimonialsVisible },
    { key: 'poll' as TabKey, label: t('poll.label'), icon: <Vote size={14} />, enabled: pollVisible },
    { key: 'faq' as TabKey, label: t('faq.label'), icon: <HelpCircle size={14} />, enabled: faqVisible },
  ];
  const tabs = allTabs.filter(t => t.enabled);
  const currentTab = tabs.find(t => t.key === activeTab) ? activeTab : tabs[0]?.key || 'gallery';

  if (tabs.length === 0) return null;

  return (
    <section id="community" className="py-16 sm:py-20 px-4" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-green)' }}>{t('community.label')}</span>
          <h2 className="font-display text-2xl sm:text-3xl mt-2" style={{ color: 'var(--text-primary)' }}>{t('community.heading')}</h2>
          <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>{t('community.subheading')}</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full p-1 gap-1 flex-wrap justify-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--bg-surface-light)' }}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border-none" style={{ background: currentTab === tab.key ? 'var(--accent-green)' : 'transparent', color: currentTab === tab.key ? 'white' : 'var(--text-secondary)' }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div key={currentTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {currentTab === 'gallery' && <GalleryTab t={t} lang={lang} />}
              {currentTab === 'partners' && <PartnersTab t={t} lang={lang} />}
              {currentTab === 'social' && <SocialTab t={t} lang={lang} />}
              {currentTab === 'testimonials' && <TestimonialsTab t={t} lang={lang} />}
              {currentTab === 'poll' && <PollTab t={t} lang={lang} />}
              {currentTab === 'faq' && <FaqTab t={t} lang={lang} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
