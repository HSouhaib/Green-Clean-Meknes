// useState imported for future use
import { useLanguage } from '@/hooks/useLanguage';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { trpc } from '@/lib/trpc';
import { Rss, ExternalLink } from 'lucide-react';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>,
  tiktok: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  twitter: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
};

const PLATFORM_LABELS: Record<string, Record<string, string>> = {
  en: { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', twitter: 'X' },
  fr: { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', twitter: 'X' },
  ar: { instagram: 'إنستغرام', tiktok: 'تيك توك', facebook: 'فيسبوك', twitter: 'إكس' },
};

export default function SocialFeedSection() {
  const { t, lang } = useLanguage();
  const { isVisible } = useSectionVisibility();
  const { data: posts } = trpc.socialFeed.list.useQuery();

  if (!isVisible('socialFeed')) return null;
  if (!posts || posts.length === 0) return null;

  const getCaption = (post: typeof posts[0]) => {
    if (lang === 'fr' && post.captionFr) return post.captionFr;
    if (lang === 'ar' && post.captionAr) return post.captionAr;
    return post.captionEn || '';
  };

  return (
    <section id="socialFeed" className="py-16 sm:py-20 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Rss size={18} style={{ color: 'var(--accent-green)' }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-green)' }}>
              {t('socialFeed.label')}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            {t('socialFeed.heading')}
          </h2>
          <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('socialFeed.subheading')}
          </p>
        </div>

        {/* Horizontal Scrolling Cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex-shrink-0 snap-start w-[280px] sm:w-[300px] rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
            >
              {/* Image */}
              <div className="relative aspect-[4/5] overflow-hidden">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={getCaption(post)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-surface-light)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </div>
                )}
                {/* Platform Badge */}
                <div
                  className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(0,0,0,0.7)', color: 'white', backdropFilter: 'blur(4px)' }}
                >
                  {PLATFORM_ICONS[post.platform] || <Rss size={14} />}
                  {PLATFORM_LABELS[lang]?.[post.platform] || post.platform}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {getCaption(post) && (
                  <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                    {getCaption(post)}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {post.authorName && (
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {post.authorName}
                    </span>
                  )}
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80 no-underline"
                    style={{ color: 'var(--accent-green)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} />
                    {PLATFORM_LABELS[lang]?.[post.platform] || post.platform}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
