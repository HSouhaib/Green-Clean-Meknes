import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin } from 'lucide-react';

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

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center rounded-lg font-mono font-bold"
        style={{
          width: 'clamp(48px, 8vw, 72px)',
          height: 'clamp(48px, 8vw, 72px)',
          background: 'var(--accent-green)',
          color: '#fff',
          fontSize: 'clamp(1.25rem, 3vw, 2rem)',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span
        className="text-[10px] uppercase tracking-widest mt-2 font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </div>
  );
}

export default function CountdownSection() {
  const { t, lang } = useLanguage();
  const { data: nextCampaign, isLoading } = trpc.campaign.nextCampaign.useQuery();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    nextCampaign?.eventDate
      ? calculateTimeLeft(new Date(nextCampaign.eventDate))
      : { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );

  useEffect(() => {
    if (!nextCampaign?.eventDate) return;
    const target = new Date(nextCampaign.eventDate);
    const update = () => setTimeLeft(calculateTimeLeft(target));
    const immediate = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [nextCampaign?.eventDate]);

  if (isLoading) {
    return (
      <section style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-primary)' }}>
        <div className="mx-auto text-center" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
          <div className="animate-pulse h-32 rounded-lg" style={{ background: 'var(--bg-surface)' }} />
        </div>
      </section>
    );
  }

  if (!nextCampaign) {
    return null;
  }

  const title = lang === 'fr' && nextCampaign.titleFr
    ? nextCampaign.titleFr
    : lang === 'ar' && nextCampaign.titleAr
    ? nextCampaign.titleAr
    : nextCampaign.titleEn;

  const location = lang === 'fr' && nextCampaign.locationFr
    ? nextCampaign.locationFr
    : lang === 'ar' && nextCampaign.locationAr
    ? nextCampaign.locationAr
    : nextCampaign.locationEn;

  const eventDate = nextCampaign.eventDate ? new Date(nextCampaign.eventDate) : null;
  const dateStr = eventDate
    ? eventDate.toLocaleDateString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : nextCampaign.date;

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <section style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-primary)' }}>
      <div className="mx-auto" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Calendar size={18} style={{ color: 'var(--accent-green)' }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--accent-green)' }}>
              {t('countdown.next_campaign')}
            </span>
          </div>

          <div className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Campaign info */}
            <div className="flex-1 text-center md:text-left">
              <h3
                className="font-display leading-tight"
                style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
              >
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-4 mt-3 justify-center md:justify-start">
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin size={14} style={{ color: 'var(--accent-green)' }} />
                  {location}
                </div>
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <Clock size={14} style={{ color: 'var(--accent-green)' }} />
                  {dateStr}
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-3 md:gap-4">
              {isExpired ? (
                <div
                  className="px-6 py-3 rounded-lg font-medium"
                  style={{
                    background: 'var(--accent-green)',
                    color: '#fff',
                  }}
                >
                  {t('countdown.started')}
                </div>
              ) : (
                <>
                  <CountdownUnit value={timeLeft.days} label={t('countdown.days')} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)', marginTop: '-20px' }}>:</span>
                  <CountdownUnit value={timeLeft.hours} label={t('countdown.hours')} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)', marginTop: '-20px' }}>:</span>
                  <CountdownUnit value={timeLeft.minutes} label={t('countdown.minutes')} />
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)', marginTop: '-20px' }}>:</span>
                  <CountdownUnit value={timeLeft.seconds} label={t('countdown.seconds')} />
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
