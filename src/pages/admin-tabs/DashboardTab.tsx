import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/hooks/useLanguage';
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
  PanelTop,
  ScanLine,
  Camera,
  Handshake,
  Rss,
  UserPlus,
  Shield,
  Settings,
  MapPin,
  MessageSquare,
  BarChart3,
  Trophy,
} from 'lucide-react';

interface DashboardTabProps {
  onNavigate: (tab: string) => void;
}

export function DashboardTab({ onNavigate }: DashboardTabProps) {
  const { t } = useLanguage();
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
    { labelKey: 'admin.tab.landing_page', icon: <PanelTop size={16} />, tab: 'landing', color: 'var(--accent-blue)' },
    { labelKey: 'admin.tab.new_campaign', icon: <Plus size={16} />, tab: 'campaigns', color: 'var(--accent-green)' },
    { labelKey: 'admin.tab.presence', icon: <ScanLine size={16} />, tab: 'presence', color: 'var(--accent-terracotta)' },
    { labelKey: 'admin.tab.photos', icon: <Camera size={16} />, tab: 'photos', color: 'var(--accent-blue)' },
    { labelKey: 'admin.tab.sponsors', icon: <Handshake size={16} />, tab: 'sponsors', color: 'var(--accent-amber)' },
    { labelKey: 'admin.tab.social_feed', icon: <Rss size={16} />, tab: 'socialFeed', color: 'var(--accent-green)' },
    { labelKey: 'admin.tab.users', icon: <Users size={16} />, tab: 'users', color: 'var(--accent-blue)' },
    { labelKey: 'admin.tab.volunteers', icon: <UserPlus size={16} />, tab: 'volunteers', color: 'var(--accent-terracotta)' },
    { labelKey: 'admin.tab.roles', icon: <Shield size={16} />, tab: 'roles', color: 'var(--accent-amber)' },
    { labelKey: 'admin.tab.view_contacts', icon: <Mail size={16} />, tab: 'contacts', color: 'var(--accent-blue)' },
    { labelKey: 'admin.tab.planning', icon: <Lightbulb size={16} />, tab: 'plans', color: 'var(--accent-green)' },
    { labelKey: 'admin.tab.settings', icon: <Settings size={16} />, tab: 'settings', color: 'var(--text-tertiary)' },
    { labelKey: 'admin.tab.neighborhoods', icon: <MapPin size={16} />, tab: 'neighborhoods', color: 'var(--accent-green)' },
    { labelKey: 'admin.tab.add_faq', icon: <HelpCircle size={16} />, tab: 'faqs', color: 'var(--accent-terracotta)' },
    { labelKey: 'admin.tab.testimonials', icon: <MessageSquare size={16} />, tab: 'testimonials', color: 'var(--accent-blue)' },
    { labelKey: 'admin.tab.polls', icon: <BarChart3 size={16} />, tab: 'polls', color: 'var(--accent-green)' },
    { labelKey: 'admin.tab.leaderboard', icon: <Trophy size={16} />, tab: 'leaderboard', color: 'var(--accent-amber)' },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('admin.dashboard.total_users')}
          value={totalUsers}
          icon={<Users size={20} />}
          color="var(--accent-blue)"
          onClick={() => onNavigate('users')}
        />
        <StatCard
          title={t('admin.dashboard.active_campaigns')}
          value={activeCampaigns}
          icon={<Calendar size={20} />}
          color="var(--accent-green)"
          onClick={() => onNavigate('campaigns')}
        />
        <StatCard
          title={t('admin.dashboard.total_volunteers')}
          value={totalRegistrations}
          icon={<UserCheck size={20} />}
          color="var(--accent-terracotta)"
          onClick={() => onNavigate('campaigns')}
        />
        <StatCard
          title={t('admin.dashboard.unread_contacts')}
          value={unreadCount}
          icon={<Mail size={20} />}
          color="var(--accent-amber)"
          onClick={() => onNavigate('contacts')}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
          {t('admin.dashboard.quick_actions')}
        </h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <button
              key={action.labelKey}
              onClick={() => onNavigate(action.tab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90 cursor-pointer"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            >
              <span style={{ color: action.color }}>{action.icon}</span>
              {t(action.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
          {t('admin.dashboard.recent_activity')}
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
