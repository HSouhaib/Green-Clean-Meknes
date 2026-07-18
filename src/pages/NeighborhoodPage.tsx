import { useParams, Link } from 'react-router';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { MapPin, Users, TreePine, Trash2, Calendar, ArrowLeft, ImageOff } from 'lucide-react';
import Navigation from '@/sections/Navigation';
import Footer from '@/sections/Footer';

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

export default function NeighborhoodPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, dir } = useLanguage();
  const { data: neighborhood, isLoading } = trpc.neighborhood.getBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-20">
          <div className="mx-auto" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
            <div className="animate-pulse h-64 rounded-lg" style={{ background: 'var(--bg-surface)' }} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!neighborhood) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
              {t('neighborhoods.not_found')}
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              {t('neighborhoods.not_found_desc')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--accent-green)', color: '#fff' }}
            >
              <ArrowLeft size={18} />
              {t('neighborhoods.back_home')}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
    <>
      <Navigation />
      <main className="min-h-screen pt-20" dir={dir}>
        {/* Hero */}
        <div className="relative h-72 md:h-96 overflow-hidden">
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
              style={{ background: 'var(--bg-surface)' }}
            >
              <ImageOff size={64} style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="mx-auto" style={{ maxWidth: '1400px', padding: '0 var(--page-margin)' }}>
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-sm mb-3 transition-colors hover:underline"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <ArrowLeft size={14} />
                {t('neighborhoods.back_home')}
              </Link>
              <h1 className="font-display text-white text-3xl md:text-5xl leading-tight">{name}</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto py-10" style={{ padding: '40px var(--page-margin)', maxWidth: '1400px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={18} style={{ color: 'var(--accent-green)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {t('neighborhoods.location')}
                  </span>
                </div>
                <p
                  className="text-base leading-relaxed font-light"
                  style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}
                >
                  {description}
                </p>
              </motion.div>
            </div>

            {/* Stats sidebar */}
            {statItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl p-6"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  height: 'fit-content',
                }}
              >
                <h3
                  className="font-display text-sm uppercase tracking-wider mb-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t('neighborhoods.stats')}
                </h3>
                <div className="space-y-4">
                  {statItems.map((stat) => (
                    <div
                      key={stat.key}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: 'var(--bg-primary)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(107, 142, 90, 0.15)' }}
                      >
                        <stat.icon size={18} style={{ color: 'var(--accent-green)' }} />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                          {stat.value?.toLocaleString()}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
