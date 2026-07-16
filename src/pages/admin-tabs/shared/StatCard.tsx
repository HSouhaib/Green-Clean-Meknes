import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

export function StatCard({ title, value, trend, trendLabel, icon, color, onClick }: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl transition-all duration-200 ${onClick ? 'cursor-pointer hover:opacity-80 hover:shadow-lg' : ''}`}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
            {title}
          </p>
          <p className="text-2xl font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp size={14} style={{ color: 'var(--accent-green)' }} />
              ) : (
                <TrendingDown size={14} style={{ color: 'var(--accent-terracotta)' }} />
              )}
              <span
                className="text-xs font-medium"
                style={{ color: isPositive ? 'var(--accent-green)' : 'var(--accent-terracotta)' }}
              >
                {isPositive ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
