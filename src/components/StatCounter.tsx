import CountUp from 'react-countup';

interface StatCounterProps {
  end: number;
  suffix?: string;
  label: string;
}

export default function StatCounter({ end, suffix = '', label }: StatCounterProps) {
  // react-countup can resolve to its namespace object in some bundler interop
  // scenarios; unwrap the default export if needed.
  const CountUpComponent = (CountUp as unknown as { default?: typeof CountUp }).default ?? CountUp;

  return (
    <div className="text-center sm:text-left">
      <div className="font-display text-[28px]" style={{ color: 'var(--accent-green-light)' }}>
        <CountUpComponent end={end} duration={1.5} suffix={suffix} />
      </div>
      <div className="text-xs font-light mt-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
    </div>
  );
}
