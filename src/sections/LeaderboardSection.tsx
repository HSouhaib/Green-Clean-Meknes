import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { Link } from 'react-router';
import { Trophy, Users, ArrowRight, Medal } from 'lucide-react';

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return <img src={src} alt={name} className="w-full h-full object-cover" />;
  }
  return (
    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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

function PodiumCard({
  leader,
  rank,
  order,
  height,
}: {
  leader: { name: string; avatar: string | null; totalPoints: number };
  rank: number;
  order: string;
  height: string;
}) {
  const { t } = useLanguage();
  const borders: Record<number, string> = {
    1: 'rgba(255,215,0,0.4)',
    2: 'rgba(192,192,192,0.3)',
    3: 'rgba(205,127,50,0.3)',
  };
  const gradients: Record<number, string> = {
    1: 'linear-gradient(180deg, rgba(255,215,0,0.12) 0%, transparent 100%)',
    2: 'linear-gradient(180deg, rgba(192,192,192,0.1) 0%, transparent 100%)',
    3: 'linear-gradient(180deg, rgba(205,127,50,0.1) 0%, transparent 100%)',
  };
  const size = rank === 1 ? 'w-20 h-20' : 'w-16 h-16';
  const iconSize = rank === 1 ? 26 : 20;

  return (
    <div className={`${order} w-full md:w-56 ${height}`}>
      <div
        className="flex flex-col items-center justify-end rounded-xl h-full p-5"
        style={{
          background: gradients[rank],
          border: `1px solid ${borders[rank]}`,
        }}
      >
        <Medal size={iconSize} style={{ color: borders[rank], marginBottom: '10px' }} />
        <div
          className={`${size} rounded-full overflow-hidden flex items-center justify-center mb-3`}
          style={{ background: 'var(--bg-surface-light)', border: `2px solid ${borders[rank]}` }}
        >
          <Avatar src={leader.avatar} name={leader.name} />
        </div>
        <span
          className={`font-bold ${rank === 1 ? 'text-3xl' : 'text-2xl'}`}
          style={{ color: borders[rank] }}
        >
          {rank}
        </span>
        <span
          className="text-sm font-medium mt-1 text-center truncate max-w-full"
          style={{ color: 'var(--text-primary)' }}
        >
          {leader.name}
        </span>
        <span className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {leader.totalPoints} {t('leaderboard.points')}
        </span>
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
        style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}
      >
        <div className="text-center mb-12">
          <Trophy
            size={32}
            style={{ color: 'var(--accent-green)', margin: '0 auto 12px' }}
          />
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
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-10">
            <div className="w-full md:w-56 h-64 rounded-xl" style={{ background: 'var(--bg-surface)' }} />
            <div className="w-full md:w-64 h-80 rounded-xl" style={{ background: 'var(--bg-surface)' }} />
            <div className="w-full md:w-56 h-56 rounded-xl" style={{ background: 'var(--bg-surface)' }} />
          </div>
        ) : leaders?.length === 0 ? (
          <div
            className="text-center py-12 rounded-lg mb-8"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)', color: 'var(--text-secondary)' }}
          >
            {t('leaderboard.empty')}
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-10">
                {topThree[1] && (
                  <PodiumCard leader={topThree[1]} rank={2} order="order-2 md:order-1" height="h-64" />
                )}
                {topThree[0] && (
                  <PodiumCard leader={topThree[0]} rank={1} order="order-1 md:order-2" height="h-80" />
                )}
                {topThree[2] && (
                  <PodiumCard leader={topThree[2]} rank={3} order="order-3" height="h-56" />
                )}
              </div>
            )}

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
                    style={{ borderBottom: '1px solid var(--bg-surface-light)' }}
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
