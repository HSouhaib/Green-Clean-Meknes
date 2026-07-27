import { trpc } from '@/lib/trpc';

const DEFAULT_ORDER = [
  'hero',
  'impact',
  'about',
  'leaderboard',
  'neighborhoods',
  'gallery',
  'sponsors',
  'socialFeed',
  'testimonials',
  'poll',
  'faq',
  'airQuality',
  'howToJoin',
  'campaigns',
  'contact',
  'donation',
];

const COMMUNITY_KEYS = new Set([
  'gallery',
  'sponsors',
  'socialFeed',
  'testimonials',
  'poll',
  'faq',
]);

export function useSectionOrder() {
  const { data: visibilityData, isLoading: visibilityLoading } =
    trpc.section.list.useQuery();
  const { data: orderData, isLoading: orderLoading } =
    trpc.section.getOrder.useQuery();

  const isLoading = visibilityLoading || orderLoading;

  const orderedSections = (() => {
    if (isLoading) return [];

    const orderMap = new Map(
      orderData?.map((o) => [o.sectionKey, o.sortOrder]) ?? []
    );

    const allKeys = Array.from(
      new Set([...DEFAULT_ORDER, ...(orderData?.map((o) => o.sectionKey) ?? [])])
    );

    const sorted = allKeys
      .map((key) => ({
        key,
        sortOrder: orderMap.get(key) ?? DEFAULT_ORDER.indexOf(key) + 1,
        isVisible:
          visibilityData?.find((v) => v.sectionKey === key)?.isVisible ?? true,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Collapse consecutive community sub-sections into a single 'community' slot
    // positioned at the first visible community sub-section. This keeps the
    // existing tabbed CommunitySection UI while still respecting admin order.
    const result: string[] = [];
    let communityAdded = false;

    for (const item of sorted) {
      if (COMMUNITY_KEYS.has(item.key)) {
        if (item.isVisible && !communityAdded) {
          result.push('community');
          communityAdded = true;
        }
      } else if (item.isVisible) {
        result.push(item.key);
      }
    }

    return result;
  })();

  return { orderedSections, isLoading };
}
