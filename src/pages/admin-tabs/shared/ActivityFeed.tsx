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

function formatTimeAgo(date: Date | null): string {
  if (!date) return 'Unknown';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'user.role_changed': 'changed user role',
    'user.activated': 'activated user',
    'user.deactivated': 'deactivated user',
    'role.created': 'created role',
    'role.updated': 'updated role',
    'role.deleted': 'deleted role',
    'plan.created': 'created plan',
    'plan.updated': 'updated plan',
    'plan.deleted': 'deleted plan',
    'campaign.created': 'created campaign',
    'campaign.updated': 'updated campaign',
    'campaign.deleted': 'deleted campaign',
  };
  return labels[action] || action.replace('.', ' ');
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No recent activity
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
              <span style={{ color: 'var(--text-secondary)' }}>{getActionLabel(activity.action)}</span>
              {activity.entityType && (
                <span className="text-xs ml-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {activity.entityType}
                  {activity.entityId ? ` #${activity.entityId}` : ''}
                </span>
              )}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {formatTimeAgo(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
