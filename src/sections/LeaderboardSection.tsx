import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { Link } from 'react-router';
import { Trophy, Users, ArrowRight, Crown, Sparkles } from 'lucide-react';
import type { RouterOutputs } from '@/lib/trpc';

type Leader = RouterOutputs['leaderboard']['getTop'][number];

function Avatar({ src, name, className }: { src: string | null; name: string; className?: string }) {
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
    glow: 'rgba(107, 142, 90, 0.18)',
    text: 'var(--accent-green)',
    bg: 'rgba(107, 142, 90, 0.10)',
    shadow: '0 8px 24px rgba(107, 142, 90, 0.18)',
  },
  2: {
    border: 'rgba(107, 142, 90, 0.55)',
    glow: 'rgba(107, 142, 90, 0.12)',
    text: 'var(--accent-green-light)',
    bg: 'rgba(107, 142, 90, 0.07)',
    shadow: '0 6px 18px rgba(107, 142, 90, 0.12)',
  },
  3: {
    border: 'rgba(107, 142, 90, 0.35)',
    glow: 'rgba(107, 142, 90, 0.08)',
    text: 'var(--text-secondary)',
    bg: 'rgba(107, 142, 90, 0.04)',
    shadow: '0 4px 12px rgba(107, 142, 90, 0.08)',
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

  const heightClass = isCenter ? 'h-36 md:h-44' : 'h-32 md:h-40';
  const avatarSize = isCenter ? 'w-14 h-14 md:w-16 md:h-16' : 'w-10 h-10 md:w-12 md:h-12';

  return (
    <div className={`${orderClass} w-full md:w-36 ${heightClass} flex flex-col`}>
      <div
        className="relative flex-1 flex flex-col items-center justify-end rounded-xl p-3 overflow-hidden"
        style={{
          background: styles.bg,
          border: `1px solid ${styles.border}`,
          boxShadow: styles.shadow,
        }}
      >
        {/* Rank badge */}
        <div
          className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
          style={{
            background: styles.glow,
            color: styles.text,
            border: `1px solid ${styles.border}`,
          }}
        >
          {rank === 1 ? <Crown size={10} /> : `#${rank}`}
        </div>

        {/* Avatar */}
        <div
          className={`${avatarSize} rounded-full p-0.5 mb-2`}
          style={{
            background: styles.border,
          }}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--bg-surface-light)' }}
          >
            <Avatar
              src={leader.avatar}
              name={leader.name}
              className="text-sm"
            />
          </div>
        </div>

        <span
          className="text-xs font-semibold text-center truncate max-w-full"
          style={{ color: 'var(--text-primary)' }}
        >
          {leader.name}
        </span>

        <span
          className="text-[10px] mt-0.5 flex items-center gap-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {leader.totalPoints} {t('leaderboard.points')}
        </span>

        {leader.isGuest && (
          <span
            className="mt-1 text-[9px] px-1.5 py-0.5 rounded-full"
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
      className="group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-[var(--bg-surface-light)]"
      style={{
        borderBottom: '1px solid var(--bg-surface-light)',
      }}
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
        style={{
          background: 'var(--bg-surface-light)',
          color: 'var(--text-tertiary)',
        }}
      >
        {leader.rank}
      </div>

      <div
        className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--bg-surface-light)' }}
      >
        <Avatar src={leader.avatar} name={leader.name} className="text-[10px]" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[11px] font-medium truncate flex items-center gap-1.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {leader.name}
          {leader.isGuest && (
            <span
              className="text-[9px] px-1 py-0 rounded-full"
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
          className="text-[9px] flex items-center gap-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Users size={9} />
          {leader.attendedCount} {t('leaderboard.campaigns_attended')}
        </p>
      </div>

      <div
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
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

export default function LeaderboardSection() {
  const { t } = useLanguage();
  const { isVisible } = useSectionVisibility();
  const { data: leaders, isLoading } = trpc.leaderboard.getTop.useQuery(
    { limit: 10 },
    { staleTime: 1000 * 60 * 2 }
  );

  if (!isVisible('leaderboard')) return null;

  const topThree = leaders?.slice(0, 3) ?? [];
  const rest = leaders?.slice(3) ?? [];

  return (
    <section id="leaderboard" style={{ padding: 'calc(var(--section-gap) * 0.65) 0' }}>
      <div
        className="mx-auto"
        style={{ padding: '0 var(--page-margin)', maxWidth: '900px' }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <h2
            className="font-display mb-1.5 flex items-center justify-center gap-2"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              letterSpacing: '-0.02em',
            }}
          >
            <Trophy size={16} style={{ color: 'var(--accent-green)' }} />
            {t('leaderboard.heading')}
          </h2>
          <p
            className="text-[11px] font-light mx-auto max-w-md flex items-center justify-center gap-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Sparkles size={11} style={{ color: 'var(--accent-green)' }} />
            {t('leaderboard.subheading')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col md:flex-row items-end justify-center gap-3 mb-6">
            <div
              className="w-full md:w-36 h-32 rounded-xl"
              style={{ background: 'var(--bg-surface)' }}
            />
            <div
              className="w-full md:w-40 h-36 rounded-xl"
              style={{ background: 'var(--bg-surface)' }}
            />
            <div
              className="w-full md:w-36 h-32 rounded-xl"
              style={{ background: 'var(--bg-surface)' }}
            />
          </div>
        ) : leaders?.length === 0 ? (
          <div
            className="text-center py-10 rounded-xl mb-6"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-surface-light)',
              color: 'var(--text-secondary)',
            }}
          >
            <Trophy
              size={28}
              className="mx-auto mb-2 opacity-30"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <span className="text-xs">{t('leaderboard.empty')}</span>
          </div>
        ) : (
          <>
            {/* Podium */}
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

            {/* Runners-up */}
            {rest.length > 0 && (
              <div
                className="rounded-xl overflow-hidden mb-5"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-surface-light)',
                }}
              >
                {rest.map((leader) => (
                  <RunnerRow
                    key={leader.identity}
                    leader={leader}
                  />
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="flex justify-center">
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 hover:gap-2"
                style={{
                  background: 'var(--accent-green)',
                  color: 'var(--bg-primary)',
                }}
              >
                {t('leaderboard.view_all')}
                <ArrowRight size={12} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
