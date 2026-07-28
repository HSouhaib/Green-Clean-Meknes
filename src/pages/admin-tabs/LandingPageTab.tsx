import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { SortableList } from './shared/SortableList';
import { useErrorModal } from '@/hooks/useErrorModal';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Eye,
  EyeOff,
  GripVertical,
  Home,
  BarChart3,
  Info,
  MapPin,
  MessageSquare,
  Users,
  Mail,
  Heart,
  Wind,
  Vote,
  HelpCircle,
  Calendar,
  Camera,
  Trophy,
  Handshake,
  Rss,
} from 'lucide-react';

const SECTION_CONFIG: Record<string, { icon: React.ReactNode }> = {
  hero: { icon: <Home size={16} /> },
  impact: { icon: <BarChart3 size={16} /> },
  about: { icon: <Info size={16} /> },
  leaderboard: { icon: <Trophy size={16} /> },
  neighborhoods: { icon: <MapPin size={16} /> },
  testimonials: { icon: <MessageSquare size={16} /> },
  gallery: { icon: <Camera size={16} /> },
  sponsors: { icon: <Handshake size={16} /> },
  socialFeed: { icon: <Rss size={16} /> },
  howToJoin: { icon: <Users size={16} /> },
  faq: { icon: <HelpCircle size={16} /> },
  campaigns: { icon: <Calendar size={16} /> },
  contact: { icon: <Mail size={16} /> },
  donation: { icon: <Heart size={16} /> },
  airQuality: { icon: <Wind size={16} /> },
  poll: { icon: <Vote size={16} /> },
};

export function LandingPageTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: visibilityData } = trpc.section.list.useQuery();
  const { data: orderData } = trpc.section.getOrder.useQuery();

  const toggleMutation = trpc.section.toggle.useMutation({
    onSuccess: () => {
      utils.section.list.invalidate();
      toast.success(t('toast.section_visibility_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const orderMutation = trpc.section.updateOrder.useMutation({
    onSuccess: () => {
      utils.section.getOrder.invalidate();
      toast.success(t('toast.section_order_updated'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  // Merge visibility and order data
  const sections = Object.entries(SECTION_CONFIG).map(([key, config]) => {
    const visibility = visibilityData?.find((v) => v.sectionKey === key);
    const order = orderData?.find((o) => o.sectionKey === key);
    return {
      key,
      label: t(`admin.landing.section.${key}`),
      icon: config.icon,
      isVisible: visibility?.isVisible ?? true,
      sortOrder: order?.sortOrder ?? 0,
    };
  });

  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleToggle = (sectionKey: string, currentVisible: boolean) => {
    toggleMutation.mutate({ sectionKey, isVisible: !currentVisible });
  };

  const handleReorder = (newItems: typeof sortedSections) => {
    const updates = newItems.map((item, index) => ({
      sectionKey: item.key,
      sortOrder: index,
    }));
    orderMutation.mutate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            {t('admin.landing.title')}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {t('admin.landing.description')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section List */}
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
            {t('admin.landing.sections')}
          </h3>
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--bg-surface-light)' }}
          >
            <SortableList
              items={sortedSections}
              keyExtractor={(item) => item.key}
              onReorder={handleReorder}
              renderItem={(item, index, isDragging) => (
                <div
                  className="flex items-center gap-3 p-4 transition-colors"
                  style={{
                    background: isDragging ? 'var(--bg-surface-light)' : 'var(--bg-surface)',
                    borderBottom: '1px solid var(--bg-surface-light)',
                  }}
                >
                  <GripVertical
                    size={16}
                    className="flex-shrink-0 cursor-grab"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {t('admin.landing.order').replace('{index}', String(index + 1))}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key, item.isVisible)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors flex-shrink-0"
                    style={{
                      background: item.isVisible ? 'var(--accent-green)' : 'var(--bg-surface-light)',
                      color: item.isVisible ? 'white' : 'var(--text-tertiary)',
                    }}
                    title={item.isVisible ? t('admin.landing.hide_section') : t('admin.landing.show_section')}
                  >
                    {item.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              )}
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
            {t('admin.landing.preview')}
          </h3>
          <div
            className="rounded-lg p-4 space-y-2"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
          >
            {sortedSections.map((section, index) => (
              <div
                key={section.key}
                className="flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{
                  background: section.isVisible ? 'var(--bg-primary)' : 'transparent',
                  opacity: section.isVisible ? 1 : 0.4,
                  border: section.isVisible ? '1px solid var(--bg-surface-light)' : '1px dashed var(--bg-surface-light)',
                }}
              >
                <span
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0"
                  style={{
                    background: section.isVisible ? 'var(--accent-green)' : 'var(--bg-surface-light)',
                    color: section.isVisible ? 'white' : 'var(--text-tertiary)',
                  }}
                >
                  {index + 1}
                </span>
                <span className="text-sm" style={{ color: section.isVisible ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {section.label}
                </span>
                {!section.isVisible && (
                  <span className="text-xs ml-auto font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    {t('admin.landing.hidden')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
