import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { Link } from 'react-router';
import { Trophy, Users, ArrowRight } from 'lucide-react';

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <span
      className="text-sm font-medium"
      style={{ color: 'var(--text-primary)' }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
  };
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
      style={{
        background: colors[rank] ?? 'var(--bg-surface-light)',
        color: rank <= 3 ? '#000' : 'var(--text-secondary)',
      }}
    >
      {rank}
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
    <section
      id="leaderboard"
      style={{ padding: 'var(--section-gap) 0' }}
    >
      <div
        className="mx-auto"
        style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}
      >
        <div className="text-center mb-12">
          <h2
            className="font-display"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('leaderboard.heading')}
          </h2>
          <p
            className="text-sm font-light mt-2 mx-auto max-w-md"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('leaderboard.subheading')}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            {t('leaderboard.loading')}
          </div>
        ) : leaders?.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            {t('leaderboard.empty')}
          </div>
        ) : (
          <>
            {/* Podium */}
            {topThree.length > 0 && (
              <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-12">
                {topThree[1] && (
                  <div
                    className="flex flex-col items-center p-6 rounded-lg w-full md:w-56 order-2 md:order-1"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--bg-surface-light)',
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden mb-3 flex items-center justify-center"
                      style={{ background: 'var(--bg-surface-light)' }}
                    >
                      <Avatar src={topThree[1].avatar} name={topThree[1].name} />
                    </div>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: '#C0C0C0' }}
                    >
                      2
                    </span>
                    <span
                      className="text-sm font-medium mt-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {topThree[1].name}
                    </span>
                    <span
                      className="text-xs mt-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {topThree[1].totalPoints} {t('leaderboard.points')}
                    </span>
                  </div>
                )}

                {topThree[0] && (
                  <div
                    className="flex flex-col items-center p-8 rounded-lg w-full md:w-64 order-1 md:order-2"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--accent-green)',
                    }}
                  >
                    <Trophy
                      size={28}
                      style={{ color: '#FFD700' }}
                      className="mb-2"
                    />
                    <div
                      className="w-20 h-20 rounded-full overflow-hidden mb-3 flex items-center justify-center"
                      style={{ background: 'var(--bg-surface-light)' }}
                    >
                      <Avatar src={topThree[0].avatar} name={topThree[0].name} />
                    </div>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: '#FFD700' }}
                    >
                      1
                    </span>
                    <span
                      className="text-base font-medium mt-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {topThree[0].name}
                    </span>
                    <span
                      className="text-sm mt-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {topThree[0].totalPoints} {t('leaderboard.points')}
                    </span>
                  </div>
                )}

                {topThree[2] && (
                  <div
                    className="flex flex-col items-center p-6 rounded-lg w-full md:w-56 order-3"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--bg-surface-light)',
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden mb-3 flex items-center justify-center"
                      style={{ background: 'var(--bg-surface-light)' }}
                    >
                      <Avatar src={topThree[2].avatar} name={topThree[2].name} />
                    </div>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: '#CD7F32' }}
                    >
                      3
                    </span>
                    <span
                      className="text-sm font-medium mt-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {topThree[2].name}
                    </span>
                    <span
                      className="text-xs mt-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {topThree[2].totalPoints} {t('leaderboard.points')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <div
                className="rounded-lg overflow-hidden mb-8"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-surface-light)',
                }}
              >
                {rest.map((leader) => (
                  <div
                    key={leader.userId}
                    className="flex items-center gap-4 p-4"
                    style={{
                      borderBottom: '1px solid var(--bg-surface-light)',
                    }}
                  >
                    <RankBadge rank={leader.rank} />
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-surface-light)' }}
                    >
                      <Avatar src={leader.avatar} name={leader.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {leader.name}
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
                      className="text-sm font-bold"
                      style={{ color: 'var(--accent-green-light)' }}
                    >
                      {leader.totalPoints}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: 'var(--accent-green)',
                  color: 'var(--bg-primary)',
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
