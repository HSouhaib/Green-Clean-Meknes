import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = +targetDate - +new Date();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

type CountdownSize = 'sm' | 'md' | 'lg';

function CountdownUnit({
  value,
  label,
  size,
}: {
  value: number;
  label: string;
  size: CountdownSize;
}) {
  const boxStyles = {
    sm: { width: '36px', height: '36px', fontSize: '0.85rem', borderRadius: '6px' },
    md: { width: '48px', height: '48px', fontSize: '1.1rem', borderRadius: '8px' },
    lg: { width: '64px', height: '64px', fontSize: '1.5rem', borderRadius: '12px' },
  }[size];
  const labelSize = size === 'lg' ? 'text-[10px]' : size === 'md' ? 'text-[9px]' : 'text-[8px]';

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center font-mono font-bold"
        style={{
          ...boxStyles,
          background: 'var(--accent-green)',
          color: '#fff',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span
        className={`${labelSize} uppercase tracking-wider mt-1.5 font-medium`}
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </div>
  );
}

interface CampaignCountdownProps {
  eventDate: Date | string | null;
  labels?: {
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
    started?: string;
  };
  compact?: boolean;
  size?: CountdownSize;
}

export default function CampaignCountdown({
  eventDate,
  labels,
  compact = false,
  size = 'md',
}: CampaignCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    eventDate ? calculateTimeLeft(new Date(eventDate)) : { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );

  useEffect(() => {
    if (!eventDate) return;
    const target = new Date(eventDate);
    const update = () => setTimeLeft(calculateTimeLeft(target));
    const immediate = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [eventDate]);

  if (!eventDate) return null;

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <div
        className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium"
        style={{ background: 'var(--accent-green)', color: '#fff' }}
      >
        {labels?.started ?? 'Campaign Started'}
      </div>
    );
  }

  const gap = compact ? 'gap-2' : size === 'lg' ? 'gap-4' : 'gap-3';
  const colonSize = compact ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const colonOffset = compact ? '-mt-4' : size === 'lg' ? '-mt-2' : '-mt-5';

  return (
    <div className={`flex items-center ${gap}`}>
      <CountdownUnit value={timeLeft.days} label={labels?.days ?? 'Days'} size={size} />
      <span className={`font-bold ${colonSize} ${colonOffset}`} style={{ color: 'var(--text-tertiary)' }}>:</span>
      <CountdownUnit value={timeLeft.hours} label={labels?.hours ?? 'Hours'} size={size} />
      <span className={`font-bold ${colonSize} ${colonOffset}`} style={{ color: 'var(--text-tertiary)' }}>:</span>
      <CountdownUnit value={timeLeft.minutes} label={labels?.minutes ?? 'Minutes'} size={size} />
      <span className={`font-bold ${colonSize} ${colonOffset}`} style={{ color: 'var(--text-tertiary)' }}>:</span>
      <CountdownUnit value={timeLeft.seconds} label={labels?.seconds ?? 'Seconds'} size={size} />
    </div>
  );
}
