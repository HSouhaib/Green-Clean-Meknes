import { trpc } from '@/lib/trpc';

export function useSectionVisibility() {
  const { data: sections } = trpc.section.list.useQuery();

  const isVisible = (key: string) => {
    const section = sections?.find((s) => s.sectionKey === key);
    return section?.isVisible ?? true;
  };

  return { sections, isVisible };
}
