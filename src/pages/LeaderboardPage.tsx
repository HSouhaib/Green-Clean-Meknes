import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { Link } from 'react-router';
import { ArrowLeft, Trophy, Users, Search, Calendar } from 'lucide-react';

type Period = 'all' | 'year' | 'month';

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
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
      style={{
        background: colors[rank] ?? 'var(--bg-surface-light)',
        color: rank <= 3 ? '#000' : 'var(--text-secondary)',
      }}
    >
      {rank}
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

  const periods: { key: Period; label: string }[] = [
    { key: 'all', label: t('leaderboard.period.all') },
    { key: 'year', label: t('leaderboard.period.year') },
    { key: 'month', label: t('leaderboard.period.month') },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--bg-surface-light)',
        }}
      >
        <div
          className="mx-auto flex items-center justify-between py-4"
          style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-sm"
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
        style={{ padding: '0 var(--page-margin)', maxWidth: '900px' }}
      >
        <div className="text-center mb-10">
          <Trophy
            size={48}
            style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }}
          />
          <h2
            className="font-display text-3xl mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('leaderboard.heading')}
          </h2>
          <p
            className="text-sm font-light max-w-md mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('leaderboard.subheading')}
          </p>
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
                left: isRtl ? 'auto' : '12px',
                right: isRtl ? '12px' : 'auto',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('leaderboard.search_placeholder')}
              className="w-full rounded-lg px-10 py-2.5 text-sm"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-surface-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex gap-2">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background:
                    period === p.key
                      ? 'var(--accent-green)'
                      : 'var(--bg-surface)',
                  color:
                    period === p.key ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--bg-surface-light)',
                }}
              >
                <Calendar size={14} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div
            className="text-center py-16"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('leaderboard.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16 rounded-lg"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-surface-light)',
              color: 'var(--text-secondary)',
            }}
          >
            {search.trim() ? t('leaderboard.no_search_results') : t('leaderboard.empty')}
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-surface-light)',
            }}
          >
            {filtered.map((leader) => (
              <div
                key={leader.userId}
                className="flex items-center gap-4 p-4"
                style={{
                  borderBottom: '1px solid var(--bg-surface-light)',
                }}
              >
                <RankBadge rank={leader.rank} />
                <div
                  className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-surface-light)' }}
                >
                  <Avatar src={leader.avatar} name={leader.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-base font-medium truncate"
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
                  className="text-lg font-bold"
                  style={{ color: 'var(--accent-green-light)' }}
                >
                  {leader.totalPoints} {t('leaderboard.points')}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
