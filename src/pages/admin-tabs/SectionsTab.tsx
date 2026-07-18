import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';

export function SectionsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: sections, isLoading } = trpc.section.list.useQuery();
  const toggleMutation = trpc.section.toggle.useMutation({
    onSuccess: () => {
      utils.section.list.invalidate();
      toast.success(t('toast.visibility_toggled'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const sectionLabels: Record<string, string> = {
    hero: 'Hero Section',
    impact: 'Impact Stats Section',
    about: 'About Section',
    neighborhoods: 'Neighborhoods Section',
    testimonials: 'Testimonials Section',
    gallery: 'Photo Gallery Section',
    sponsors: 'Sponsors Section',
    socialFeed: 'Social Feed Section',
    faq: 'FAQ Section',
    airQuality: 'Air Quality Section',
    poll: 'Poll Section',
    howToJoin: 'How to Join Section',
    campaigns: 'Campaigns Section',
    contact: 'Contact Section',
    donation: 'Donation Section',
    leaderboard: 'Leaderboard Section',
  };

  if (isLoading) return <div className="p-8" style={{ color: 'var(--text-secondary)' }}>Loading sections...</div>;

  return (
    <div>
      <h2 className="text-xl font-medium mb-6" style={{ color: 'var(--text-primary)' }}>Landing Page Sections</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Toggle visibility of each section on the public landing page.
      </p>
      <div className="space-y-3">
        {sections?.map((section) => (
          <div
            key={section.sectionKey}
            className="flex items-center justify-between p-4 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
          >
            <div>
              <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {sectionLabels[section.sectionKey] ?? section.sectionKey}
              </span>
              <span className="ml-2 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                #{section.sectionKey}
              </span>
            </div>
            <button
              onClick={() => toggleMutation.mutate({ sectionKey: section.sectionKey, isVisible: !section.isVisible })}
              className="px-4 py-2 rounded text-xs font-medium transition-colors"
              style={{
                background: section.isVisible ? 'rgba(58,90,42,0.3)' : 'rgba(85,85,85,0.3)',
                color: section.isVisible ? 'var(--accent-green-light)' : 'var(--text-tertiary)',
              }}
            >
              {section.isVisible ? 'Visible' : 'Hidden'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
