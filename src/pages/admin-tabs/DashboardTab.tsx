import { trpc } from '@/lib/trpc';
import { StatCard } from './shared/StatCard';
import { ActivityFeed } from './shared/ActivityFeed';
import {
  Users,
  Calendar,
  UserCheck,
  Mail,
  Plus,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface DashboardTabProps {
  onNavigate: (tab: string) => void;
}

export function DashboardTab({ onNavigate }: DashboardTabProps) {
  const { data: stats } = trpc.campaign.stats.useQuery();
  const { data: unreadContacts } = trpc.contact.unreadCount.useQuery();
  const { data: allUsers } = trpc.user.list.useQuery({ page: 1, limit: 1000 });
  const { data: campaignsList } = trpc.campaign.listAll.useQuery();
  const { data: activityData } = trpc.activity.list.useQuery({ page: 1, limit: 20 });

  const totalUsers = allUsers?.total ?? 0;
  const activeCampaigns = campaignsList?.filter((c) => c.isActive).length ?? 0;
  const totalRegistrations = stats?.volunteers ?? 0;
  const unreadCount = unreadContacts ?? 0;

  const quickActions = [
    { label: 'New Campaign', icon: <Plus size={16} />, tab: 'campaigns', color: 'var(--accent-green)' },
    { label: 'Add FAQ', icon: <HelpCircle size={16} />, tab: 'faqs', color: 'var(--accent-terracotta)' },
    { label: 'View Contacts', icon: <Mail size={16} />, tab: 'contacts', color: 'var(--accent-blue)' },
    { label: 'Planning', icon: <Lightbulb size={16} />, tab: 'plans', color: 'var(--accent-green)' },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<Users size={20} />}
          color="var(--accent-blue)"
          onClick={() => onNavigate('users')}
        />
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={<Calendar size={20} />}
          color="var(--accent-green)"
          onClick={() => onNavigate('campaigns')}
        />
        <StatCard
          title="Total Volunteers"
          value={totalRegistrations}
          icon={<UserCheck size={20} />}
          color="var(--accent-terracotta)"
          onClick={() => onNavigate('campaigns')}
        />
        <StatCard
          title="Unread Contacts"
          value={unreadCount}
          icon={<Mail size={20} />}
          color="var(--accent-amber)"
          onClick={() => onNavigate('contacts')}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.tab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90 cursor-pointer"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            >
              <span style={{ color: action.color }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
          Recent Activity
        </h3>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--bg-surface-light)' }}
        >
          <ActivityFeed
            activities={
              activityData?.logs.map((log) => ({
                id: log.id,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                userName: log.userName,
                createdAt: log.createdAt,
                details: log.details,
              })) ?? []
            }
          />
        </div>
      </div>
    </div>
  );
}
