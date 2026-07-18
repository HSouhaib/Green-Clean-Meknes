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
  { border: string; glow: string; text: string; bg: string; icon: string }
> = {
  1: {
    border: 'rgba(255, 215, 0, 0.35)',
    glow: 'rgba(255, 215, 0, 0.18)',
    text: '#FFD700',
    bg: 'linear-gradient(180deg, rgba(255,215,0,0.14) 0%, rgba(255,215,0,0.02) 100%)',
    icon: '#FFD700',
  },
  2: {
    border: 'rgba(192, 192, 192, 0.35)',
    glow: 'rgba(192, 192, 192, 0.14)',
    text: '#C0C0C0',
    bg: 'linear-gradient(180deg, rgba(192,192,192,0.12) 0%, rgba(192,192,192,0.02) 100%)',
    icon: '#C0C0C0',
  },
  3: {
    border: 'rgba(205, 127, 50, 0.35)',
    glow: 'rgba(205, 127, 50, 0.14)',
    text: '#CD7F32',
    bg: 'linear-gradient(180deg, rgba(205,127,50,0.12) 0%, rgba(205,127,50,0.02) 100%)',
    icon: '#CD7F32',
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

  const heightClass = isCenter ? 'h-80 md:h-96' : 'h-64 md:h-72';
  const avatarSize = isCenter ? 'w-24 h-24 md:w-28 md:h-28' : 'w-18 h-18 md:w-20 md:h-20';
  const nameSize = isCenter ? 'text-base' : 'text-sm';

  return (
    <div className={`${orderClass} w-full md:w-64 ${heightClass} flex flex-col`}>
      <div
        className="relative flex-1 flex flex-col items-center justify-end rounded-2xl p-5 overflow-hidden"
        style={{
          background: styles.bg,
          border: `1px solid ${styles.border}`,
          boxShadow: `0 0 40px ${styles.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* Rank crown */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full"
          style={{ background: styles.glow }}
        >
          {rank === 1 ? (
            <Crown size={16} style={{ color: styles.icon }} />
          ) : (
            <span className="text-xs font-bold" style={{ color: styles.text }}>
              #{rank}
            </span>
          )}
        </div>

        {/* Avatar ring */}
        <div
          className={`${avatarSize} rounded-full p-1 mb-4`}
          style={{
            background: `linear-gradient(135deg, ${styles.border}, transparent)`,
            boxShadow: `0 0 24px ${styles.glow}`,
          }}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--bg-surface-light)' }}
          >
            <Avatar
              src={leader.avatar}
              name={leader.name}
              className="text-xl"
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
          className="text-xs mt-1 flex items-center gap-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {leader.totalPoints} {t('leaderboard.points')}
        </span>

        {leader.isGuest && (
          <span
            className="mt-2 text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-tertiary)',
            }}
          >
            {t('leaderboard.guest')}
          </span>
        )}
      </div>

      {/* Pedestal */}
      <div
        className="h-3 w-full rounded-b-xl mt-1"
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
        background: isTop
          ? 'rgba(107,142,90,0.04)'
          : 'transparent',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
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
        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--bg-surface-light)' }}
      >
        <Avatar src={leader.avatar} name={leader.name} className="text-sm" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate flex items-center gap-2"
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
        className="text-sm font-bold px-3 py-1 rounded-full"
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
    <section id="leaderboard" style={{ padding: 'var(--section-gap) 0' }}>
      <div
        className="mx-auto"
        style={{ padding: '0 var(--page-margin)', maxWidth: '1200px' }}
      >
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{
              background: 'rgba(107,142,90,0.12)',
              border: '1px solid rgba(107,142,90,0.2)',
              boxShadow: '0 0 24px rgba(107,142,90,0.12)',
            }}
          >
            <Trophy size={28} style={{ color: 'var(--accent-green)' }} />
          </div>
          <h2
            className="font-display mb-3"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('leaderboard.heading')}
          </h2>
          <p
            className="text-sm font-light mx-auto max-w-md flex items-center justify-center gap-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Sparkles size={14} style={{ color: 'var(--accent-green)' }} />
            {t('leaderboard.subheading')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col md:flex-row items-end justify-center gap-5 mb-12">
            <div
              className="w-full md:w-64 h-72 rounded-2xl"
              style={{ background: 'var(--bg-surface)' }}
            />
            <div
              className="w-full md:w-72 h-96 rounded-2xl"
              style={{ background: 'var(--bg-surface)' }}
            />
            <div
              className="w-full md:w-64 h-64 rounded-2xl"
              style={{ background: 'var(--bg-surface)' }}
            />
          </div>
        ) : leaders?.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl mb-8"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-surface-light)',
              color: 'var(--text-secondary)',
            }}
          >
            <Trophy
              size={40}
              className="mx-auto mb-4 opacity-30"
              style={{ color: 'var(--text-tertiary)' }}
            />
            {t('leaderboard.empty')}
          </div>
        ) : (
          <>
            {/* Podium */}
            {topThree.length > 0 && (
              <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 mb-12">
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
                className="rounded-2xl overflow-hidden mb-10"
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

            {/* CTA */}
            <div className="flex justify-center">
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 hover:gap-3"
                style={{
                  background: 'var(--accent-green)',
                  color: 'var(--bg-primary)',
                  boxShadow: '0 8px 24px rgba(107,142,90,0.25)',
                }}
              >
                {t('leaderboard.view_all')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
