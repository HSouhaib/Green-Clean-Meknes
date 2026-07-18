import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { Link } from 'react-router';
import {
  ArrowLeft,
  Trophy,
  Users,
  Search,
  Calendar,
  Crown,
  Sparkles,
  TrendingUp,
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
  { border: string; glow: string; text: string; bg: string }
> = {
  1: {
    border: 'rgba(255, 215, 0, 0.35)',
    glow: 'rgba(255, 215, 0, 0.18)',
    text: '#FFD700',
    bg: 'linear-gradient(180deg, rgba(255,215,0,0.14) 0%, rgba(255,215,0,0.02) 100%)',
  },
  2: {
    border: 'rgba(192, 192, 192, 0.35)',
    glow: 'rgba(192, 192, 192, 0.14)',
    text: '#C0C0C0',
    bg: 'linear-gradient(180deg, rgba(192,192,192,0.12) 0%, rgba(192,192,192,0.02) 100%)',
  },
  3: {
    border: 'rgba(205, 127, 50, 0.35)',
    glow: 'rgba(205, 127, 50, 0.14)',
    text: '#CD7F32',
    bg: 'linear-gradient(180deg, rgba(205,127,50,0.12) 0%, rgba(205,127,50,0.02) 100%)',
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

  const heightClass = isCenter ? 'h-88 md:h-104' : 'h-72 md:h-84';
  const avatarSize = isCenter ? 'w-28 h-28 md:w-32 md:h-32' : 'w-22 h-22 md:w-24 md:h-24';
  const nameSize = isCenter ? 'text-lg' : 'text-base';

  return (
    <div
      className={`${orderClass} w-full md:w-72 ${heightClass} flex flex-col`}
    >
      <div
        className="relative flex-1 flex flex-col items-center justify-end rounded-2xl p-6 overflow-hidden"
        style={{
          background: styles.bg,
          border: `1px solid ${styles.border}`,
          boxShadow: `0 0 48px ${styles.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full"
          style={{ background: styles.glow }}
        >
          {rank === 1 ? (
            <Crown size={20} style={{ color: styles.text }} />
          ) : (
            <span className="text-sm font-bold" style={{ color: styles.text }}>
              #{rank}
            </span>
          )}
        </div>

        <div
          className={`${avatarSize} rounded-full p-1 mb-5`}
          style={{
            background: `linear-gradient(135deg, ${styles.border}, transparent)`,
            boxShadow: `0 0 28px ${styles.glow}`,
          }}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--bg-surface-light)' }}
          >
            <Avatar
              src={leader.avatar}
              name={leader.name}
              className="text-2xl"
            />
          </div>
        </div>

        <span
          className={`${nameSize} font-semibold text-center truncate max-w-full`}
          style={{ color: 'var(--text-primary)' }}
        >
          {leader.name}
        </span>

        <span
          className="text-sm mt-1 flex items-center gap-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {leader.totalPoints} {t('leaderboard.points')}
        </span>

        {leader.isGuest && (
          <span
            className="mt-3 text-[10px] px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-tertiary)',
            }}
          >
            {t('leaderboard.guest')}
          </span>
        )}
      </div>

      <div
        className="h-4 w-full rounded-b-2xl mt-1"
        style={{
          background: styles.bg,
          border: `1px solid ${styles.border}`,
          borderTop: 'none',
        }}
      />
    </div>
  );
}

function RunnerRow({ leader, index }: { leader: Leader; index: number }) {
  const { t } = useLanguage();
  const isTop = index < 3;

  return (
    <div
      className="group flex items-center gap-4 p-4 transition-colors"
      style={{
        borderBottom: '1px solid var(--bg-surface-light)',
        background: isTop ? 'rgba(107,142,90,0.04)' : 'transparent',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
        style={{
          background: isTop
            ? 'rgba(107,142,90,0.12)'
            : 'var(--bg-surface-light)',
          color: isTop ? 'var(--accent-green)' : 'var(--text-tertiary)',
        }}
      >
        {leader.rank}
      </div>

      <div
        className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--bg-surface-light)' }}
      >
        <Avatar src={leader.avatar} name={leader.name} className="text-base" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-base font-medium truncate flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {leader.name}
          {leader.isGuest && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
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
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Users size={12} />
          {leader.attendedCount} {t('leaderboard.campaigns_attended')}
        </p>
      </div>

      <div
        className="text-base font-bold px-3 py-1.5 rounded-full"
        style={{
          background: 'rgba(107,142,90,0.1)',
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
      className="flex items-center gap-4 p-4 animate-pulse"
      style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
    >
      <div
        className="w-10 h-10 rounded-xl"
        style={{ background: 'var(--bg-surface-light)' }}
      />
      <div
        className="w-12 h-12 rounded-full"
        style={{ background: 'var(--bg-surface-light)' }}
      />
      <div className="flex-1 space-y-2">
        <div
          className="h-4 w-32 rounded"
          style={{ background: 'var(--bg-surface-light)' }}
        />
        <div
          className="h-3 w-24 rounded"
          style={{ background: 'var(--bg-surface-light)' }}
        />
      </div>
      <div
        className="h-8 w-16 rounded-full"
        style={{ background: 'var(--bg-surface-light)' }}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  const { t, lang } = useLanguage();
  const [period, setPeriod] = useState<Period>('all');
  const [search, setSearch] = useState('');

  const { data: leaders, isLoading } = trpc.leaderboard.getTop.useQuery(
    { limit: 50, period },
    { staleTime: 1000 * 60 * 2 }
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(var(--bg-surface-rgb, 10,10,10), 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--bg-surface-light)',
        }}
      >
        <div
          className="mx-auto flex items-center justify-between py-4"
          style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={18} />
            {t('nav.home')}
          </Link>
          <h1
            className="font-display text-lg"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('leaderboard.heading')}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main
        className="mx-auto py-12"
        style={{ padding: '0 var(--page-margin)', maxWidth: '1100px' }}
      >
        {/* Hero */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{
              background: 'rgba(107,142,90,0.12)',
              border: '1px solid rgba(107,142,90,0.2)',
              boxShadow: '0 0 28px rgba(107,142,90,0.12)',
            }}
          >
            <Trophy size={32} style={{ color: 'var(--accent-green)' }} />
          </div>
          <h2
            className="font-display mb-3"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('leaderboard.heading')}
          </h2>
          <p
            className="text-sm font-light max-w-md mx-auto flex items-center justify-center gap-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Sparkles size={14} style={{ color: 'var(--accent-green)' }} />
            {t('leaderboard.subheading')}
          </p>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 gap-4 mb-10"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-surface-light)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(107,142,90,0.12)' }}
            >
              <Users size={22} style={{ color: 'var(--accent-green)' }} />
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {filtered.length}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('leaderboard.participants')}
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-surface-light)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(107,142,90,0.12)' }}
            >
              <TrendingUp size={22} style={{ color: 'var(--accent-green)' }} />
            </div>
            <div>
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {totalPoints}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {t('leaderboard.points')}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className="flex flex-col sm:flex-row gap-4 mb-8"
          style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
          <div
            className="relative flex-1"
            style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          >
            <Search
              size={18}
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
              className="w-full rounded-xl px-11 py-3 text-sm"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'var(--bg-surface)' }}>
            {periods.map((p) => {
              const Icon = p.icon;
              const active = period === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? 'var(--accent-green)' : 'transparent',
                    color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={14} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="flex flex-col md:flex-row items-end justify-center gap-5 mb-10">
              <div
                className="w-full md:w-72 h-84 rounded-2xl"
                style={{ background: 'var(--bg-surface)' }}
              />
              <div
                className="w-full md:w-80 h-104 rounded-2xl"
                style={{ background: 'var(--bg-surface)' }}
              />
              <div
                className="w-full md:w-72 h-76 rounded-2xl"
                style={{ background: 'var(--bg-surface)' }}
              />
            </div>
            <div
              className="rounded-2xl overflow-hidden"
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
            className="text-center py-20 rounded-2xl"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-surface-light)',
              color: 'var(--text-secondary)',
            }}
          >
            <Trophy
              size={48}
              className="mx-auto mb-4 opacity-30"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <p className="text-base">
              {search.trim()
                ? t('leaderboard.no_search_results')
                : t('leaderboard.empty')}
            </p>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <div className="flex flex-col md:flex-row items-end justify-center gap-5 md:gap-6 mb-12">
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
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-surface-light)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                }}
              >
                {rest.map((leader, idx) => (
                  <RunnerRow
                    key={leader.identity}
                    leader={leader}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
