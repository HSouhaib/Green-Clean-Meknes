import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/hooks/useLanguage";
import { StatCard } from "./shared/StatCard";
import { ActivityFeed } from "./shared/ActivityFeed";
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
  Search,
  X,
} from "lucide-react";

interface DashboardTabProps {
  onNavigate: (tab: string) => void;
}

/** Filter chip definitions for the recent-activity feed (entityType groups). */
const ACTIVITY_FILTERS: Array<{
  key: string;
  labelKey: string;
  entityTypes?: string[];
}> = [
  { key: "all", labelKey: "admin.dashboard.filter_all" },
  {
    key: "campaigns",
    labelKey: "admin.dashboard.filter_campaigns",
    entityTypes: ["campaign", "campaign_photo"],
  },
  {
    key: "volunteers",
    labelKey: "admin.dashboard.filter_volunteers",
    entityTypes: ["volunteer_registration", "volunteer_points"],
  },
  {
    key: "users",
    labelKey: "admin.dashboard.filter_users",
    entityTypes: ["user", "role"],
  },
  {
    key: "plans",
    labelKey: "admin.dashboard.filter_plans",
    entityTypes: ["plan"],
  },
  {
    key: "content",
    labelKey: "admin.dashboard.filter_content",
    entityTypes: ["sponsor", "socialFeedPost"],
  },
];

export function DashboardTab({ onNavigate }: DashboardTabProps) {
  const { t } = useLanguage();
  const { data: stats } = trpc.campaign.stats.useQuery();
  const { data: unreadContacts } = trpc.contact.unreadCount.useQuery();
  const { data: allUsers } = trpc.user.list.useQuery({ page: 1, limit: 1000 });
  const { data: campaignsList } = trpc.campaign.listAll.useQuery();

  const [activityFilter, setActivityFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Debounce the free-text search so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const activeFilter =
    ACTIVITY_FILTERS.find(f => f.key === activityFilter) ?? ACTIVITY_FILTERS[0];
  const hasActiveFilters =
    search !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    activityFilter !== "all";
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setActivityFilter("all");
  };

  const activityQuery = trpc.activity.list.useInfiniteQuery(
    {
      limit: 10,
      ...(activeFilter.entityTypes
        ? { entityTypes: activeFilter.entityTypes }
        : {}),
      ...(search ? { search } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    },
    {
      getNextPageParam: lastPage =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    }
  );
  const activities = activityQuery.data?.pages.flatMap(page => page.logs) ?? [];

  const totalUsers = allUsers?.total ?? 0;
  const activeCampaigns = campaignsList?.filter(c => c.isActive).length ?? 0;
  const totalRegistrations = stats?.volunteers ?? 0;
  const unreadCount = unreadContacts ?? 0;

  const quickActions = [
    {
      labelKey: "admin.tab.landing_page",
      icon: <PanelTop size={16} />,
      tab: "landing",
      color: "var(--accent-blue)",
    },
    {
      labelKey: "admin.tab.new_campaign",
      icon: <Plus size={16} />,
      tab: "campaigns",
      color: "var(--accent-green)",
    },
    {
      labelKey: "admin.tab.presence",
      icon: <ScanLine size={16} />,
      tab: "presence",
      color: "var(--accent-terracotta)",
    },
    {
      labelKey: "admin.tab.photos",
      icon: <Camera size={16} />,
      tab: "photos",
      color: "var(--accent-blue)",
    },
    {
      labelKey: "admin.tab.sponsors",
      icon: <Handshake size={16} />,
      tab: "sponsors",
      color: "var(--accent-amber)",
    },
    {
      labelKey: "admin.tab.social_feed",
      icon: <Rss size={16} />,
      tab: "socialFeed",
      color: "var(--accent-green)",
    },
    {
      labelKey: "admin.tab.users",
      icon: <Users size={16} />,
      tab: "users",
      color: "var(--accent-blue)",
    },
    {
      labelKey: "admin.tab.volunteers",
      icon: <UserPlus size={16} />,
      tab: "volunteers",
      color: "var(--accent-terracotta)",
    },
    {
      labelKey: "admin.tab.roles",
      icon: <Shield size={16} />,
      tab: "roles",
      color: "var(--accent-amber)",
    },
    {
      labelKey: "admin.tab.view_contacts",
      icon: <Mail size={16} />,
      tab: "contacts",
      color: "var(--accent-blue)",
    },
    {
      labelKey: "admin.tab.planning",
      icon: <Lightbulb size={16} />,
      tab: "plans",
      color: "var(--accent-green)",
    },
    {
      labelKey: "admin.tab.settings",
      icon: <Settings size={16} />,
      tab: "settings",
      color: "var(--text-tertiary)",
    },
    {
      labelKey: "admin.tab.neighborhoods",
      icon: <MapPin size={16} />,
      tab: "neighborhoods",
      color: "var(--accent-green)",
    },
    {
      labelKey: "admin.tab.add_faq",
      icon: <HelpCircle size={16} />,
      tab: "faqs",
      color: "var(--accent-terracotta)",
    },
    {
      labelKey: "admin.tab.testimonials",
      icon: <MessageSquare size={16} />,
      tab: "testimonials",
      color: "var(--accent-blue)",
    },
    {
      labelKey: "admin.tab.polls",
      icon: <BarChart3 size={16} />,
      tab: "polls",
      color: "var(--accent-green)",
    },
    {
      labelKey: "admin.tab.leaderboard",
      icon: <Trophy size={16} />,
      tab: "leaderboard",
      color: "var(--accent-amber)",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.dashboard.total_users")}
          value={totalUsers}
          icon={<Users size={20} />}
          color="var(--accent-blue)"
          onClick={() => onNavigate("users")}
        />
        <StatCard
          title={t("admin.dashboard.active_campaigns")}
          value={activeCampaigns}
          icon={<Calendar size={20} />}
          color="var(--accent-green)"
          onClick={() => onNavigate("campaigns")}
        />
        <StatCard
          title={t("admin.dashboard.total_volunteers")}
          value={totalRegistrations}
          icon={<UserCheck size={20} />}
          color="var(--accent-terracotta)"
          onClick={() => onNavigate("campaigns")}
        />
        <StatCard
          title={t("admin.dashboard.unread_contacts")}
          value={unreadCount}
          icon={<Mail size={20} />}
          color="var(--accent-amber)"
          onClick={() => onNavigate("contacts")}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3
          className="text-sm font-mono uppercase tracking-wider mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          {t("admin.dashboard.quick_actions")}
        </h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(action => (
            <button
              key={action.labelKey}
              onClick={() => onNavigate(action.tab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90 cursor-pointer"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--bg-surface-light)",
                color: "var(--text-primary)",
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3
            className="text-sm font-mono uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("admin.dashboard.recent_activity")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_FILTERS.map(filter => {
              const isActive = filter.key === activeFilter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setActivityFilter(filter.key)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border"
                  style={
                    isActive
                      ? {
                          background: "var(--accent-green)",
                          borderColor: "var(--accent-green)",
                          color: "#ffffff",
                        }
                      : {
                          background: "var(--bg-surface)",
                          borderColor: "var(--bg-surface-light)",
                          color: "var(--text-secondary)",
                        }
                  }
                >
                  {t(filter.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity panel: toolbar + table + footer in one card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--bg-surface-light)",
          }}
        >
          {/* Toolbar strip */}
          <div
            className="activity-toolbar flex flex-wrap items-stretch"
            style={{
              background: "var(--bg-surface)",
              borderBottom: "1px solid var(--bg-surface-light)",
            }}
          >
            {/* Search segment */}
            <div
              className="flex items-center gap-2 px-3 py-2 flex-1"
              style={{ minWidth: 220 }}
            >
              <Search
                size={14}
                className="flex-shrink-0"
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={t("admin.dashboard.search_placeholder")}
                className="bg-transparent border-none outline-none flex-1 text-sm min-w-0 placeholder:text-[var(--text-tertiary)]"
                style={{ color: "var(--text-primary)" }}
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="flex-shrink-0 bg-transparent border-none cursor-pointer p-0.5 hover:opacity-70"
                  style={{ color: "var(--text-tertiary)" }}
                  aria-label={t("admin.dashboard.clear_filters")}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div
              className="my-2"
              style={{ width: 1, background: "var(--bg-surface-light)" }}
            />

            {/* Date range segments */}
            <label
              className="flex items-center gap-2 px-3 py-2 text-xs whitespace-nowrap cursor-pointer"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("admin.dashboard.date_from")}
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="activity-date-input bg-transparent border-none outline-none text-sm cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
                aria-label={t("admin.dashboard.date_from")}
              />
            </label>

            <div
              className="my-2"
              style={{ width: 1, background: "var(--bg-surface-light)" }}
            />

            <label
              className="flex items-center gap-2 px-3 py-2 text-xs whitespace-nowrap cursor-pointer"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("admin.dashboard.date_to")}
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="activity-date-input bg-transparent border-none outline-none text-sm cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
                aria-label={t("admin.dashboard.date_to")}
              />
            </label>

            {/* Clear-all segment (only when filters are active) */}
            {hasActiveFilters && (
              <>
                <div
                  className="my-2"
                  style={{ width: 1, background: "var(--bg-surface-light)" }}
                />
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 text-xs font-medium transition-opacity hover:opacity-75 cursor-pointer border-none bg-transparent"
                  style={{ color: "var(--accent-terracotta)" }}
                >
                  <X size={12} />
                  {t("admin.dashboard.clear_filters")}
                </button>
              </>
            )}
          </div>

          {/* Table */}
          {activityQuery.isLoading ? (
            <div
              className="p-8 text-center text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("admin.dashboard.loading")}
            </div>
          ) : (
            <ActivityFeed
              activities={activities.map(log => ({
                id: log.id,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                userName: log.userName,
                userRole: log.userRole,
                createdAt: log.createdAt,
                details: log.details,
              }))}
            />
          )}

          {/* Footer: load more */}
          {activityQuery.hasNextPage && (
            <button
              onClick={() => activityQuery.fetchNextPage()}
              disabled={activityQuery.isFetchingNextPage}
              className="w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-light)] cursor-pointer border-none disabled:opacity-50"
              style={{
                background: "var(--bg-surface)",
                borderTop: "1px solid var(--bg-surface-light)",
                color: "var(--text-secondary)",
              }}
            >
              {activityQuery.isFetchingNextPage
                ? t("admin.dashboard.loading")
                : t("admin.dashboard.load_more")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
