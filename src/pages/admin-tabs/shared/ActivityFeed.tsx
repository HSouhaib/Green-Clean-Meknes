import { useLanguage } from '@/hooks/useLanguage';

interface ActivityFeedProps {
  activities: Array<{
    id: number;
    action: string;
    entityType?: string | null;
    entityId?: number | null;
    userName: string;
    createdAt: Date | null;
    details?: Record<string, unknown> | null;
  }>;
}

function formatTimeAgo(
  date: Date | null,
  lang: string,
  t: (key: string) => string
): string {
  if (!date) return t('admin.dashboard.unknown');
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('admin.dashboard.just_now');
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  const localeMap: Record<string, string> = {
    en: 'en',
    fr: 'fr',
    ar: 'ar',
  };
  const rtf = new Intl.RelativeTimeFormat(localeMap[lang] || 'en', {
    numeric: 'auto',
    style: 'short',
  });

  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  return rtf.format(-minutes, 'minute');
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const { t, lang } = useLanguage();

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
        {t('admin.dashboard.no_activity')}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 py-3 px-4"
          style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
        >
          <div
            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
            style={{ background: 'var(--accent-green)' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              <span className="font-medium">{activity.userName}</span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>
                {t(`admin.activity.${activity.action}` as const)}
              </span>
              {activity.entityType && (
                <span className="text-xs ml-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {activity.entityType}
                  {activity.entityId ? ` #${activity.entityId}` : ''}
                </span>
              )}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {formatTimeAgo(activity.createdAt, lang, t)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
