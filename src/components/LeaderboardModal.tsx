import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import {
  X,
  Trophy,
  Users,
  Search,
  Calendar,
  Crown,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import type { RouterOutputs } from '@/lib/trpc';

type Period = 'all' | 'year' | 'month';
type Leader = RouterOutputs['leaderboard']['getTop'][number];

function Avatar({
  src,
  name,
  className,
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  const initial = name.charAt(0).toUpperCase() || '?';
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`w-full h-full object-cover ${className ?? ''}`}
      />
    );
  }
  return (
    <span className={`font-semibold uppercase ${className ?? ''}`}>
      {initial}
    </span>
  );
}

const rankStyles: Record<
  number,
  { border: string; glow: string; text: string; bg: string; shadow: string }
> = {
  1: {
    border: 'var(--accent-green)',
    glow: 'rgba(107, 142, 90, 0.22)',
    text: 'var(--accent-green)',
    bg: 'rgba(107, 142, 90, 0.12)',
    shadow: '0 8px 28px rgba(107, 142, 90, 0.22)',
  },
  2: {
    border: 'rgba(107, 142, 90, 0.55)',
    glow: 'rgba(107, 142, 90, 0.14)',
    text: 'var(--accent-green-light)',
    bg: 'rgba(107, 142, 90, 0.08)',
    shadow: '0 6px 20px rgba(107, 142, 90, 0.14)',
  },
  3: {
    border: 'rgba(107, 142, 90, 0.35)',
    glow: 'rgba(107, 142, 90, 0.10)',
    text: 'var(--text-secondary)',
    bg: 'rgba(107, 142, 90, 0.05)',
    shadow: '0 4px 14px rgba(107, 142, 90, 0.10)',
  },
};

function PodiumCard({
  leader,
  rank,
  position,
}: {
  leader: Leader;
  rank: number;
  position: 'left' | 'center' | 'right';
}) {
  const { t } = useLanguage();
  const styles = rankStyles[rank];
  const isCenter = position === 'center';

  const orderClass =
    position === 'left'
      ? 'order-2 md:order-1'
      : position === 'center'
        ? 'order-1 md:order-2'
        : 'order-3';

  const heightClass = isCenter ? 'h-40 md:h-52' : 'h-36 md:h-44';
  const avatarSize = isCenter ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-14 md:h-14';
  const fontSize = isCenter ? 'text-sm' : 'text-xs';

  return (
    <div className={`${orderClass} w-full md:w-44 ${heightClass} flex flex-col`}>
      <div
        className="relative flex-1 flex flex-col items-center justify-end rounded-2xl p-4 overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
        style={{
          background: styles.bg,
          border: `1px solid ${styles.border}`,
          boxShadow: styles.shadow,
        }}
      >
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold"
          style={{
            background: styles.glow,
            color: styles.text,
            border: `1px solid ${styles.border}`,
          }}
        >
          {rank === 1 ? <Crown size={12} /> : `#${rank}`}
        </div>

        <div
          className={`${avatarSize} rounded-full p-0.5 mb-3`}
          style={{ background: styles.border }}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--bg-surface-light)' }}
          >
            <Avatar src={leader.avatar} name={leader.name} className={fontSize} />
          </div>
        </div>

        <span
          className="text-xs font-semibold text-center truncate max-w-full"
          style={{ color: 'var(--text-primary)' }}
        >
          {leader.name}
        </span>

        <span
          className="text-[11px] mt-0.5 flex items-center gap-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {leader.totalPoints} {t('leaderboard.points')}
        </span>

        {leader.isGuest && (
          <span
            className="mt-1.5 text-[9px] px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--bg-surface-light)',
              color: 'var(--text-tertiary)',
            }}
          >
            {t('leaderboard.guest')}
          </span>
        )}
      </div>
    </div>
  );
}

function RunnerRow({ leader }: { leader: Leader }) {
  const { t } = useLanguage();

  return (
    <div
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-surface-light)]"
      style={{
        borderBottom: '1px solid var(--bg-surface-light)',
      }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
        style={{
          background: 'var(--bg-surface-light)',
          color: 'var(--text-tertiary)',
        }}
      >
        {leader.rank}
      </div>

      <div
        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--bg-surface-light)' }}
      >
        <Avatar src={leader.avatar} name={leader.name} className="text-xs" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium truncate flex items-center gap-1.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {leader.name}
          {leader.isGuest && (
            <span
              className="text-[9px] px-1.5 py-0 rounded-full"
              style={{
                background: 'var(--bg-surface-light)',
                color: 'var(--text-tertiary)',
              }}
            >
              {t('leaderboard.guest')}
            </span>
          )}
        </p>
        <p
          className="text-[10px] flex items-center gap-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Users size={10} />
          {leader.attendedCount} {t('leaderboard.campaigns_attended')}
        </p>
      </div>

      <div
        className="text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{
          background: 'rgba(107,142,90,0.12)',
          color: 'var(--accent-green-light)',
        }}
      >
        {leader.totalPoints}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 animate-pulse"
      style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
    >
      <div
        className="w-6 h-6 rounded-md"
        style={{ background: 'var(--bg-surface-light)' }}
      />
      <div
        className="w-9 h-9 rounded-full"
        style={{ background: 'var(--bg-surface-light)' }}
      />
      <div className="flex-1 space-y-1.5">
        <div
          className="h-3 w-28 rounded"
          style={{ background: 'var(--bg-surface-light)' }}
        />
        <div
          className="h-2.5 w-20 rounded"
          style={{ background: 'var(--bg-surface-light)' }}
        />
      </div>
      <div
        className="h-6 w-12 rounded-full"
        style={{ background: 'var(--bg-surface-light)' }}
      />
    </div>
  );
}

interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ open, onClose }: LeaderboardModalProps) {
  const { t, lang } = useLanguage();
  const [period, setPeriod] = useState<Period>('all');
  const [search, setSearch] = useState('');

  const { data: leaders, isLoading } = trpc.leaderboard.getTop.useQuery(
    { limit: 50, period },
    { staleTime: 1000 * 60 * 2, refetchOnWindowFocus: false }
  );

  const isRtl = lang === 'ar';

  const filtered = useMemo(() => {
    if (!leaders) return [];
    if (!search.trim()) return leaders;
    const term = search.toLowerCase();
    return leaders.filter((l) => l.name.toLowerCase().includes(term));
  }, [leaders, search]);

  const topThree = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const totalPoints = useMemo(
    () => filtered.reduce((sum, l) => sum + l.totalPoints, 0),
    [filtered]
  );

  const periods: { key: Period; label: string; icon: typeof Calendar }[] = [
    { key: 'all', label: t('leaderboard.period.all'), icon: Trophy },
    { key: 'year', label: t('leaderboard.period.year'), icon: Calendar },
    { key: 'month', label: t('leaderboard.period.month'), icon: Calendar },
  ];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--bg-surface-light)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{
            borderBottom: '1px solid var(--bg-surface-light)',
            background: 'var(--bg-surface)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(107,142,90,0.12)' }}
            >
              <Trophy size={18} style={{ color: 'var(--accent-green)' }} />
            </div>
            <div>
              <h2
                className="font-display text-base leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('leaderboard.heading')}
              </h2>
              <p
                className="text-[10px] flex items-center gap-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Sparkles size={9} style={{ color: 'var(--accent-green)' }} />
                {t('leaderboard.subheading')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Stats */}
          <div
            className="grid grid-cols-2 gap-3 mb-5"
            style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          >
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-surface-light)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(107,142,90,0.12)' }}
              >
                <Users size={18} style={{ color: 'var(--accent-green)' }} />
              </div>
              <div>
                <p
                  className="text-xl font-bold leading-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {filtered.length}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {t('leaderboard.participants')}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-surface-light)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(107,142,90,0.12)' }}
              >
                <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} />
              </div>
              <div>
                <p
                  className="text-xl font-bold leading-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {totalPoints}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {t('leaderboard.points')}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div
            className="flex flex-col sm:flex-row gap-3 mb-5"
            style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          >
            <div
              className="relative flex-1"
              style={{ direction: isRtl ? 'rtl' : 'ltr' }}
            >
              <Search
                size={16}
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                  left: isRtl ? 'auto' : '14px',
                  right: isRtl ? '14px' : 'auto',
                  color: 'var(--text-tertiary)',
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('leaderboard.search_placeholder')}
                className="w-full rounded-xl px-10 py-2.5 text-xs"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-surface-light)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div
              className="flex gap-1 p-1 rounded-xl shrink-0"
              style={{ background: 'var(--bg-surface)' }}
            >
              {periods.map((p) => {
                const Icon = p.icon;
                const active = period === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      background: active ? 'var(--accent-green)' : 'transparent',
                      color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon size={12} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <>
              <div className="flex flex-col md:flex-row items-end justify-center gap-3 mb-6">
                <div
                  className="w-full md:w-44 h-40 rounded-2xl"
                  style={{ background: 'var(--bg-surface)' }}
                />
                <div
                  className="w-full md:w-48 h-44 rounded-2xl"
                  style={{ background: 'var(--bg-surface)' }}
                />
                <div
                  className="w-full md:w-44 h-40 rounded-2xl"
                  style={{ background: 'var(--bg-surface)' }}
                />
              </div>
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-surface-light)',
                }}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-secondary)',
              }}
            >
              <Trophy
                size={32}
                className="mx-auto mb-2 opacity-30"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <p className="text-xs">
                {search.trim()
                  ? t('leaderboard.no_search_results')
                  : t('leaderboard.empty')}
              </p>
            </div>
          ) : (
            <>
              {topThree.length > 0 && (
                <div className="flex flex-col md:flex-row items-end justify-center gap-3 md:gap-4 mb-6">
                  {topThree[1] && (
                    <PodiumCard
                      key={topThree[1].identity}
                      leader={topThree[1]}
                      rank={2}
                      position="left"
                    />
                  )}
                  {topThree[0] && (
                    <PodiumCard
                      key={topThree[0].identity}
                      leader={topThree[0]}
                      rank={1}
                      position="center"
                    />
                  )}
                  {topThree[2] && (
                    <PodiumCard
                      key={topThree[2].identity}
                      leader={topThree[2]}
                      rank={3}
                      position="right"
                    />
                  )}
                </div>
              )}

              {rest.length > 0 && (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-surface-light)',
                  }}
                >
                  {rest.map((leader) => (
                    <RunnerRow key={leader.identity} leader={leader} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div
          className="px-6 py-3 shrink-0 flex items-center justify-center gap-2 text-[11px]"
          style={{
            borderTop: '1px solid var(--bg-surface-light)',
            color: 'var(--text-tertiary)',
          }}
        >
          <ArrowRight size={12} />
          {t('leaderboard.modal_footer')}
        </div>
      </div>
    </div>
  );
}
