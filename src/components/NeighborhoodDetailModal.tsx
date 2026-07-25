import { useNavigate } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { motion } from 'framer-motion';
import {
  X,
  MapPin,
  Users,
  TreePine,
  Trash2,
  Calendar,
  ImageOff,
  ArrowRight,
} from 'lucide-react';
import type { Campaign } from '@/types/campaign';

interface NeighborhoodWithCampaigns {
  id: number;
  nameEn: string;
  nameFr: string | null;
  nameAr: string | null;
  slug: string;
  descriptionEn: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  image: string | null;
  statsWasteKg: number | null;
  statsTrees: number | null;
  statsVolunteers: number | null;
  statsCampaigns: number | null;
  mapX: number | null;
  mapY: number | null;
  campaigns: Campaign[];
}

interface NeighborhoodDetailModalProps {
  neighborhood: NeighborhoodWithCampaigns;
  onClose: () => void;
}

interface NeighborhoodStats {
  wasteKg?: number;
  trees?: number;
  volunteers?: number;
  campaigns?: number;
}

function getStats(n: NeighborhoodWithCampaigns): NeighborhoodStats {
  const stats: NeighborhoodStats = {};
  if (n.statsWasteKg != null && n.statsWasteKg > 0) stats.wasteKg = n.statsWasteKg;
  if (n.statsTrees != null && n.statsTrees > 0) stats.trees = n.statsTrees;
  if (n.statsVolunteers != null && n.statsVolunteers > 0) stats.volunteers = n.statsVolunteers;
  if (n.statsCampaigns != null && n.statsCampaigns > 0) stats.campaigns = n.statsCampaigns;
  return stats;
}

function getNeighborhoodName(n: NeighborhoodWithCampaigns, lang: string): string {
  if (lang === 'fr' && n.nameFr) return n.nameFr;
  if (lang === 'ar' && n.nameAr) return n.nameAr;
  return n.nameEn;
}

function getNeighborhoodDescription(n: NeighborhoodWithCampaigns, lang: string): string {
  if (lang === 'fr' && n.descriptionFr) return n.descriptionFr;
  if (lang === 'ar' && n.descriptionAr) return n.descriptionAr;
  return n.descriptionEn;
}

export default function NeighborhoodDetailModal({
  neighborhood,
  onClose,
}: NeighborhoodDetailModalProps) {
  const { t, lang, dir } = useLanguage();
  const navigate = useNavigate();

  const name = getNeighborhoodName(neighborhood, lang);
  const description = getNeighborhoodDescription(neighborhood, lang);
  const stats = getStats(neighborhood);

  const statItems = [
    { key: 'waste', value: stats.wasteKg, icon: Trash2, label: t('impact.waste') },
    { key: 'trees', value: stats.trees, icon: TreePine, label: t('impact.trees') },
    { key: 'volunteers', value: stats.volunteers, icon: Users, label: t('impact.volunteers') },
    { key: 'campaigns', value: stats.campaigns, icon: Calendar, label: t('impact.campaigns') },
  ].filter((s) => s.value !== undefined);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-surface-light)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{
            background: 'rgba(0,0,0,0.4)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label={t('neighborhoods.close')}
        >
          <X size={16} />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto">
          {/* Hero image */}
          <div className="relative h-56 md:h-72 overflow-hidden">
            {neighborhood.image ? (
              <img
                src={neighborhood.image}
                alt={name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'var(--bg-primary)' }}
              >
                <ImageOff size={64} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} style={{ color: 'var(--accent-green-light)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {t('neighborhoods.location')}
                </span>
              </div>
              <h2 className="font-display text-white text-3xl md:text-4xl leading-tight">
                {name}
              </h2>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main content */}
              <div className="lg:col-span-2">
                <p
                  className="text-base leading-relaxed font-light"
                  style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}
                >
                  {description}
                </p>

                {/* Browse campaigns CTA */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/?neighborhood=${neighborhood.slug}#campaigns`);
                  }}
                  className="group mt-8 flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-surface-light)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(107, 142, 90, 0.15)' }}
                  >
                    <Calendar size={18} style={{ color: 'var(--accent-green)' }} />
                  </div>
                  <div className="text-left">
                    <span
                      className="block text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {t('neighborhoods.view_campaigns')}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {t('neighborhoods.view_campaigns_sub').replace('{count}', String(neighborhood.campaigns.length))}
                    </span>
                  </div>
                  <ArrowRight
                    size={18}
                    className="ml-auto transition-transform group-hover:translate-x-1"
                    style={{ color: 'var(--accent-green)' }}
                  />
                </button>
              </div>

              {/* Stats sidebar */}
              {statItems.length > 0 && (
                <div
                  className="rounded-xl p-5 h-fit"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-surface-light)',
                  }}
                >
                  <h3
                    className="font-display text-sm uppercase tracking-wider mb-4"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t('neighborhoods.stats')}
                  </h3>
                  <div className="space-y-3">
                    {statItems.map((stat) => (
                      <div
                        key={stat.key}
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: 'var(--bg-surface)' }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(107, 142, 90, 0.15)' }}
                        >
                          <stat.icon size={18} style={{ color: 'var(--accent-green)' }} />
                        </div>
                        <div>
                          <div
                            className="font-mono font-bold text-lg"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {stat.value?.toLocaleString()}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {stat.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
