import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { motion } from 'framer-motion';
import { MapPin, Users, TreePine, Trash2, Calendar } from 'lucide-react';
import { Link } from 'react-router';

interface NeighborhoodStats {
  wasteKg?: number;
  trees?: number;
  volunteers?: number;
  campaigns?: number;
}

function getStats(n: { statsWasteKg: number | null; statsTrees: number | null; statsVolunteers: number | null; statsCampaigns: number | null }): NeighborhoodStats {
  const stats: NeighborhoodStats = {};
  if (n.statsWasteKg != null && n.statsWasteKg > 0) stats.wasteKg = n.statsWasteKg;
  if (n.statsTrees != null && n.statsTrees > 0) stats.trees = n.statsTrees;
  if (n.statsVolunteers != null && n.statsVolunteers > 0) stats.volunteers = n.statsVolunteers;
  if (n.statsCampaigns != null && n.statsCampaigns > 0) stats.campaigns = n.statsCampaigns;
  return stats;
}

function getNeighborhoodName(n: { nameEn: string; nameFr: string | null; nameAr: string | null }, lang: string): string {
  if (lang === 'fr' && n.nameFr) return n.nameFr;
  if (lang === 'ar' && n.nameAr) return n.nameAr;
  return n.nameEn;
}

function getNeighborhoodDescription(n: { descriptionEn: string; descriptionFr: string | null; descriptionAr: string | null }, lang: string): string {
  if (lang === 'fr' && n.descriptionFr) return n.descriptionFr;
  if (lang === 'ar' && n.descriptionAr) return n.descriptionAr;
  return n.descriptionEn;
}

export default function NeighborhoodsSection() {
  const { t, lang } = useLanguage();
  const { data: neighborhoods, isLoading } = trpc.neighborhood.list.useQuery();

  if (isLoading) {
    return (
      <section id="neighborhoods" style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-surface)' }}>
        <div className="mx-auto text-center" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>{t('neighborhoods.loading')}</p>
        </div>
      </section>
    );
  }

  if (!neighborhoods || neighborhoods.length === 0) {
    return null;
  }

  return (
    <section id="neighborhoods" style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-surface)' }}>
      <div className="mx-auto" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
        {/* Section header */}
        <div className="mb-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-mono uppercase tracking-widest"
            style={{ color: 'var(--accent-green)' }}
          >
            {t('neighborhoods.label')}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display leading-[1.1] mt-3"
            style={{ color: 'var(--text-primary)', fontSize: 'clamp(24px, 3vw, 32px)', letterSpacing: '-0.02em' }}
          >
            {t('neighborhoods.heading')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm font-light mt-3 mx-auto max-w-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('neighborhoods.subheading')}
          </motion.p>
        </div>

        {/* Neighborhood cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {neighborhoods.map((neighborhood, index) => {
            const stats = getStats(neighborhood);
            const name = getNeighborhoodName(neighborhood, lang);
            const description = getNeighborhoodDescription(neighborhood, lang);

            return (
              <motion.div
                key={neighborhood.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link
                  to={`/neighborhood/${neighborhood.slug}`}
                  className="block rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {neighborhood.image ? (
                      <img
                        src={neighborhood.image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'var(--bg-surface)' }}
                      >
                        <MapPin size={40} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                      }}
                    />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-display text-white text-lg leading-tight">{name}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-sm font-light line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {description}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      {stats.wasteKg !== undefined && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <Trash2 size={12} style={{ color: 'var(--accent-green)' }} />
                          {stats.wasteKg} kg
                        </div>
                      )}
                      {stats.trees !== undefined && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <TreePine size={12} style={{ color: 'var(--accent-green)' }} />
                          {stats.trees}
                        </div>
                      )}
                      {stats.volunteers !== undefined && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <Users size={12} style={{ color: 'var(--accent-green)' }} />
                          {stats.volunteers}
                        </div>
                      )}
                      {stats.campaigns !== undefined && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <Calendar size={12} style={{ color: 'var(--accent-green)' }} />
                          {stats.campaigns}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
