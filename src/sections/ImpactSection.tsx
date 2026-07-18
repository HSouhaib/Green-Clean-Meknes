import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { useEffect, useRef, useState } from 'react';
import { TreePine, Users, Trash2, MapPin, Sprout } from 'lucide-react';

interface ImpactStatProps {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

function ImpactStat({ icon, value, suffix, label, delay }: ImpactStatProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [isVisible, value, delay]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center gap-3">
      <div
        className="w-12 h-12 flex items-center justify-center rounded-full"
        style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
      >
        {icon}
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {count.toLocaleString()}{suffix}
      </div>
      <div
        className="text-sm font-light"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </div>
    </div>
  );
}

export default function ImpactSection() {
  const { t } = useLanguage();
  const { data: stats } = trpc.campaign.stats.useQuery();

  const statValues = {
    campaigns: stats?.campaigns || 40,
    volunteers: stats?.volunteers || 800,
    wasteKg: stats?.wasteKg || 2400,
    trees: stats?.trees || 120,
    neighborhoods: stats?.neighborhoods || 12,
  };

  const statsConfig = [
    {
      icon: <TreePine size={22} strokeWidth={1.5} />,
      value: statValues.campaigns,
      suffix: '+',
      label: t('impact.campaigns'),
    },
    {
      icon: <Users size={22} strokeWidth={1.5} />,
      value: statValues.volunteers,
      suffix: '+',
      label: t('impact.volunteers'),
    },
    {
      icon: <Trash2 size={22} strokeWidth={1.5} />,
      value: statValues.wasteKg,
      suffix: '+',
      label: t('impact.waste'),
    },
    {
      icon: <Sprout size={22} strokeWidth={1.5} />,
      value: statValues.trees,
      suffix: '+',
      label: t('impact.trees'),
    },
    {
      icon: <MapPin size={22} strokeWidth={1.5} />,
      value: statValues.neighborhoods,
      suffix: '',
      label: t('impact.neighborhoods'),
    },
  ];

  return (
    <section
      id="impact"
      style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-surface)' }}
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
            {t('impact.heading')}
          </h2>
          <p
            className="text-sm font-light mt-2 mx-auto max-w-md"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('impact.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4">
          {statsConfig.map((stat, i) => (
            <ImpactStat
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={i * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
