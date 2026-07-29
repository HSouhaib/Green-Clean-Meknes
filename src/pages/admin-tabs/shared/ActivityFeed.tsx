import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { roleLabelByName } from "@/lib/roleLabels";
import { roleColors } from "./roleColors";
import {
  Activity,
  Camera,
  ChevronDown,
  HandHeart,
  Handshake,
  Leaf,
  Lightbulb,
  Rss,
  Shield,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

interface ActivityItem {
  id: number;
  action: string;
  entityType?: string | null;
  entityId?: number | null;
  userName: string;
  userRole?: string | null;
  createdAt: Date | null;
  details?: Record<string, unknown> | null;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

/** Icon + accent color per logged entity type (drives row scannability). */
const ENTITY_META: Record<string, { icon: LucideIcon; color: string }> = {
  campaign: { icon: Leaf, color: "var(--accent-green)" },
  campaign_photo: { icon: Camera, color: "var(--accent-green)" },
  volunteer_registration: {
    icon: HandHeart,
    color: "var(--accent-terracotta)",
  },
  volunteer_points: { icon: Trophy, color: "var(--accent-gold)" },
  user: { icon: Users, color: "var(--accent-blue)" },
  role: { icon: Shield, color: "var(--accent-blue)" },
  plan: { icon: Lightbulb, color: "var(--accent-amber)" },
  sponsor: { icon: Handshake, color: "var(--accent-gold)" },
  socialFeedPost: { icon: Rss, color: "var(--accent-terracotta)" },
};
const DEFAULT_META = { icon: Activity, color: "var(--text-tertiary)" };

/**
 * Role | Action | Description | Time — one shared grid for the header and
 * every row, so column tracks stay aligned across the whole feed.
 */
const GRID_COLUMNS =
  "minmax(110px, max-content) minmax(190px, auto) 1fr max-content";

/** Best human-readable target of an action, taken from logged details. */
function entityTitle(details?: Record<string, unknown> | null): string | null {
  if (!details) return null;
  const candidate =
    details.title ??
    details.name ??
    details.question ??
    details.labelEn ??
    details.email;
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

/**
 * Translated action label. Falls back to a humanized action string
 * ("volunteer.approved" → "volunteer approved") for untranslated keys.
 */
function actionLabel(action: string, t: (key: string) => string): string {
  const key = `admin.activity.${action}`;
  const label = t(key);
  if (label && label !== key) return label;
  return action.replace(/[._]/g, " ");
}

/** Clock time in HH:MM:SS (24h), per the feed's explicit-time requirement. */
function formatClock(
  date: Date | null,
  lang: string,
  t: (key: string) => string
): string {
  if (!date) return t("admin.dashboard.unknown");
  return new Intl.DateTimeFormat(lang, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(date));
}

function formatAbsolute(date: Date, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(date));
}

/** Day bucket key used for grouping rows under date headers. */
function dayKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(
  date: Date,
  lang: string,
  t: (key: string) => string
): string {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const key = dayKey(date);
  if (key === today) return t("admin.dashboard.today");
  if (key === yesterday) return t("admin.dashboard.yesterday");
  return new Intl.DateTimeFormat(lang, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function RoleBadge({ role }: { role: string | null | undefined }) {
  const { t, lang } = useLanguage();
  const color = (role && roleColors[role]) || "var(--text-tertiary)";
  const label = role
    ? roleLabelByName(role, undefined, lang, t)
    : t("admin.dashboard.system");
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const { t, lang } = useLanguage();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hoverId, setHoverId] = useState<number | null>(null);

  if (activities.length === 0) {
    return (
      <div
        className="p-8 text-center text-sm"
        style={{ color: "var(--text-tertiary)" }}
      >
        {t("admin.dashboard.no_activity")}
      </div>
    );
  }

  // Group chronologically ordered activities under day headers.
  const groups: Array<{ key: string; label: string; items: ActivityItem[] }> =
    [];
  for (const activity of activities) {
    const date = activity.createdAt ? new Date(activity.createdAt) : null;
    const key = date ? dayKey(date) : "unknown";
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(activity);
    } else {
      groups.push({
        key,
        label: date ? dayLabel(date, lang, t) : t("admin.dashboard.unknown"),
        items: [activity],
      });
    }
  }

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Last actually-rendered row (skips collapsed groups) loses its border.
  const lastVisibleGroup = [...groups]
    .reverse()
    .find(g => !collapsed.has(g.key) && g.items.length > 0);
  const lastRowId =
    lastVisibleGroup?.items[lastVisibleGroup.items.length - 1]?.id;

  const headerCellClass =
    "px-4 py-2 text-[11px] font-mono uppercase tracking-wider";
  const headerCellStyle = {
    color: "var(--text-tertiary)",
    background: "var(--bg-surface)",
    borderBottom: "1px solid var(--bg-surface-light)",
  } as const;

  return (
    <div className="overflow-x-auto">
      <div
        className="grid items-stretch"
        style={{
          gridTemplateColumns: GRID_COLUMNS,
          minWidth: 620,
        }}
      >
        {/* Column header */}
        <span className={headerCellClass} style={headerCellStyle}>
          {t("admin.dashboard.col_role")}
        </span>
        <span className={headerCellClass} style={headerCellStyle}>
          {t("admin.dashboard.col_action")}
        </span>
        <span className={headerCellClass} style={headerCellStyle}>
          {t("admin.dashboard.col_description")}
        </span>
        <span className={`${headerCellClass} text-end`} style={headerCellStyle}>
          {t("admin.dashboard.col_time")}
        </span>

        {groups.map(group => {
          const isCollapsed = collapsed.has(group.key);
          return (
            <div key={group.key} className="contents">
              {/* Day header (collapsible) */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider sticky top-0 cursor-pointer border-none text-start"
                style={{
                  gridColumn: "1 / -1",
                  color: "var(--text-tertiary)",
                  background: "var(--bg-surface)",
                  borderBottom: "1px solid var(--bg-surface-light)",
                }}
              >
                <ChevronDown
                  size={12}
                  style={{
                    transform: isCollapsed ? "rotate(-90deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
                {group.label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{
                    background: "var(--bg-surface-light)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {group.items.length}
                </span>
              </button>

              {!isCollapsed &&
                group.items.map(activity => {
                  const meta =
                    (activity.entityType && ENTITY_META[activity.entityType]) ||
                    DEFAULT_META;
                  const Icon = meta.icon;
                  const title = entityTitle(activity.details);
                  const isHovered = hoverId === activity.id;
                  const cellStyle = {
                    background: isHovered ? "var(--bg-surface)" : "transparent",
                    transition: "background 0.15s ease",
                    borderBottom:
                      activity.id === lastRowId
                        ? "none"
                        : "1px solid var(--bg-surface-light)",
                  } as const;
                  const hoverHandlers = {
                    onMouseEnter: () => setHoverId(activity.id),
                    onMouseLeave: () => setHoverId(null),
                  };
                  return (
                    <div key={activity.id} className="contents">
                      {/* Role */}
                      <div
                        className="py-2.5 px-4 flex items-center"
                        style={cellStyle}
                        {...hoverHandlers}
                      >
                        <RoleBadge role={activity.userRole} />
                      </div>

                      {/* Action */}
                      <div
                        className="py-2.5 px-4 flex items-center gap-2 min-w-0"
                        style={cellStyle}
                        {...hoverHandlers}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                            color: meta.color,
                          }}
                        >
                          <Icon size={13} />
                        </div>
                        <span
                          className="activity-action text-sm truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {actionLabel(activity.action, t)}
                        </span>
                      </div>

                      {/* Description */}
                      <div
                        className="py-2.5 px-4 flex items-center min-w-0"
                        style={cellStyle}
                        {...hoverHandlers}
                      >
                        <p
                          className="text-sm truncate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {activity.userName}
                          </span>
                          {title && <span> — “{title}”</span>}
                          {!title && activity.entityType && (
                            <span className="text-xs font-mono">
                              {" "}
                              {activity.entityType}
                              {activity.entityId
                                ? ` #${activity.entityId}`
                                : ""}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Time (HH:MM:SS, 24h) */}
                      <div
                        className="py-2.5 px-4 flex items-center justify-end text-xs font-mono whitespace-nowrap"
                        style={{
                          ...cellStyle,
                          color: "var(--text-tertiary)",
                        }}
                        title={
                          activity.createdAt
                            ? formatAbsolute(activity.createdAt, lang)
                            : undefined
                        }
                        {...hoverHandlers}
                      >
                        {formatClock(activity.createdAt, lang, t)}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
