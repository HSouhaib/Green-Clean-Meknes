// useState imported for future use
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { SortableList } from './shared/SortableList';
import { useErrorModal } from '@/hooks/useErrorModal';
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
} from 'lucide-react';

const SECTION_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  hero: { label: 'Hero Banner', icon: <Home size={16} /> },
  impact: { label: 'Impact Stats', icon: <BarChart3 size={16} /> },
  about: { label: 'About Us', icon: <Info size={16} /> },
  neighborhoods: { label: 'Neighborhoods', icon: <MapPin size={16} /> },
  testimonials: { label: 'Testimonials', icon: <MessageSquare size={16} /> },
  gallery: { label: 'Photo Gallery', icon: <Camera size={16} /> },
  howToJoin: { label: 'How to Join', icon: <Users size={16} /> },
  faq: { label: 'FAQ', icon: <HelpCircle size={16} /> },
  campaigns: { label: 'Campaigns', icon: <Calendar size={16} /> },
  contact: { label: 'Contact', icon: <Mail size={16} /> },
  donation: { label: 'Donation', icon: <Heart size={16} /> },
  airQuality: { label: 'Air Quality', icon: <Wind size={16} /> },
  poll: { label: 'Poll', icon: <Vote size={16} /> },
};

export function LandingPageTab() {
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: visibilityData } = trpc.section.list.useQuery();
  const { data: orderData } = trpc.section.getOrder.useQuery();

  const toggleMutation = trpc.section.toggle.useMutation({
    onSuccess: () => {
      utils.section.list.invalidate();
      toast.success('Section visibility updated');
    },
    onError: () => showError('Failed to update visibility'),
  });

  const orderMutation = trpc.section.updateOrder.useMutation({
    onSuccess: () => {
      utils.section.getOrder.invalidate();
      toast.success('Section order updated');
    },
    onError: () => showError('Failed to update order'),
  });

  // Merge visibility and order data
  const sections = Object.entries(SECTION_CONFIG).map(([key, config]) => {
    const visibility = visibilityData?.find((v) => v.sectionKey === key);
    const order = orderData?.find((o) => o.sectionKey === key);
    return {
      key,
      label: config.label,
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
            Landing Page Builder
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Drag to reorder sections. Toggle visibility to show or hide sections on the landing page.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section List */}
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Sections
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
                      Order: {index + 1}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key, item.isVisible)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors flex-shrink-0"
                    style={{
                      background: item.isVisible ? 'var(--accent-green)' : 'var(--bg-surface-light)',
                      color: item.isVisible ? 'white' : 'var(--text-tertiary)',
                    }}
                    title={item.isVisible ? 'Hide section' : 'Show section'}
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
            Preview
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
                    Hidden
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
