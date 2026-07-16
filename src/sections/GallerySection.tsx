import { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { trpc } from '@/providers/trpc';
import { Camera, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface PhotoPair {
  before: { imageUrl: string; captionEn?: string | null; captionFr?: string | null; captionAr?: string | null };
  after: { imageUrl: string; captionEn?: string | null; captionFr?: string | null; captionAr?: string | null };

}
export default function GallerySection() {
  const { t, lang } = useLanguage();
  const { isVisible } = useSectionVisibility();
  const { data: galleryData } = trpc.campaignPhoto.listByCampaign.useQuery();
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [pairIndices, setPairIndices] = useState<Record<number, number>>({});

  // Build campaign groups - MUST be before any conditional returns
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

  // Lightbox navigation callbacks - MUST be before any conditional returns
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

  // NOW safe to do conditional returns
  if (!isVisible('gallery')) return null;
  if (campaignGroups.length === 0) return null;

  const getCurrentPairIndex = (campaignId: number) => pairIndices[campaignId] ?? 0;

  const cyclePair = (campaignId: number, pairsLength: number) => {
    setPairIndices(prev => ({
      ...prev,
      [campaignId]: ((prev[campaignId] ?? 0) + 1) % pairsLength,
    }));
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

  return (
    <section id="gallery" className="py-16 sm:py-20 px-4" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Camera size={18} style={{ color: 'var(--accent-green)' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-green)' }}>
              {t('gallery.label')}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            {t('gallery.heading')}
          </h2>
          <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('gallery.subheading')}
          </p>
        </div>

        {/* Campaign Cards */}
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
                {/* Before/After Slider Container */}
                <div className="relative aspect-[4/3] overflow-hidden group">
                  {/* Before Image (left half) */}
                  <div className="absolute inset-0 w-1/2 overflow-hidden" style={{ borderRight: '2px solid var(--accent-green)' }}>
                    <img
                      src={pair.before.imageUrl}
                      alt={t('gallery.before')}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div
                      className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
                      style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
                    >
                      {t('gallery.before')}
                    </div>
                  </div>
                  {/* After Image (right half) */}
                  <div className="absolute inset-0 left-1/2 overflow-hidden">
                    <img
                      src={pair.after.imageUrl}
                      alt={t('gallery.after')}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div
                      className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
                      style={{ background: 'var(--accent-green)', color: 'white' }}
                    >
                      {t('gallery.after')}
                    </div>
                  </div>
                  {/* Slider Handle */}
                  <div
                    className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2"
                    style={{ background: 'var(--accent-green)' }}
                  >
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--accent-green)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Cycle Button (if multiple pairs) */}
                  {hasMultiplePairs && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cyclePair(group.campaign.id, group.pairs.length);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all hover:scale-110"
                      style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }}
                      title={`${group.pairs.length} photo pairs — click to cycle`}
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}

                  {/* Pair Counter */}
                  {hasMultiplePairs && (
                    <div
                      className="absolute top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-mono"
                      style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }}
                    >
                      {pairIdx + 1} / {group.pairs.length}
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {getCampaignTitle(group.campaign)}
                    </h3>
                    {hasMultiplePairs && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>
                        {group.pairs.length} pairs
                      </span>
                    )}
                  </div>
                  {(getCaption(pair.before) || getCaption(pair.after)) && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {getCaption(pair.after) || getCaption(pair.before)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedCampaign !== null && selectedGroup && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedCampaign(null)}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
            >
              <X size={20} />
            </button>

            {/* Navigation */}
            {campaignGroups.length > 1 && (
              <>
                <button
                  onClick={handlePrevCampaign}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
                  style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextCampaign}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
                  style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Full Comparison */}
            {(() => {
              const pair = selectedGroup.pairs[selectedPairIndex] || selectedGroup.pairs[0];
              if (!pair) return null;

              return (
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {/* Before Image (left half) */}
                    <div className="absolute inset-0 w-1/2 overflow-hidden" style={{ borderRight: '2px solid var(--accent-green)' }}>
                      <img src={pair.before.imageUrl} alt={t('gallery.before')} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute bottom-4 left-4 px-3 py-1 rounded text-xs font-mono uppercase" style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                        {t('gallery.before')}
                      </div>
                    </div>
                    {/* After Image (right half) */}
                    <div className="absolute inset-0 left-1/2 overflow-hidden">
                      <img src={pair.after.imageUrl} alt={t('gallery.after')} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute bottom-4 right-4 px-3 py-1 rounded text-xs font-mono uppercase" style={{ background: 'var(--accent-green)', color: 'white' }}>
                        {t('gallery.after')}
                      </div>
                    </div>
                    {/* Slider Handle */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2" style={{ background: 'var(--accent-green)' }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-green)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6" />
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>

                    {/* Pair Navigation within campaign */}
                    {selectedGroup.pairs.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPairIndex(i => i === 0 ? selectedGroup.pairs.length - 1 : i - 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                          style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                          {selectedPairIndex + 1} / {selectedGroup.pairs.length}
                        </span>
                        <button
                          onClick={() => setSelectedPairIndex(i => i === selectedGroup.pairs.length - 1 ? 0 : i + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                          style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      {getCampaignTitle(selectedGroup.campaign)}
                    </h3>
                    {(getCaption(pair.before) || getCaption(pair.after)) && (
                      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                        {getCaption(pair.after) || getCaption(pair.before)}
                      </p>
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
