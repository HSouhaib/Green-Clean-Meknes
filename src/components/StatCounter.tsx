import CountUp from 'react-countup';

interface StatCounterProps {
  end: number;
  suffix?: string;
  label: string;
}

export default function StatCounter({ end, suffix = '', label }: StatCounterProps) {
  return (
    <div className="text-center sm:text-left">
      <div className="font-display text-[28px]" style={{ color: 'var(--accent-green-light)' }}>
        <CountUp end={end} duration={1.5} suffix={suffix} />
      </div>
      <div className="text-xs font-light mt-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
    </div>
  );
}
