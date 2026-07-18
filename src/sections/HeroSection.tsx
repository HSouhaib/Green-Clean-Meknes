import { openLoginModal } from '@/hooks/useLoginModal';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import TreeCanvas from '@/components/TreeCanvas';
import WeatherEffects from '@/components/WeatherEffects';
import { useWeather, getWeatherIcon, getWeatherTranslationKey } from '@/hooks/useWeather';
import { ChevronDown, Droplets, Wind } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function getWindArrow(deg: number): string {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const idx = Math.round(deg / 45) % 8;
  return arrows[idx];
}

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function HeroSection() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { weather } = useWeather();

  const handleCtaClick = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    const el = document.querySelector('#campaigns');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ paddingTop: '64px' }}
    >
      {/* Background tree canvas */}
      <div className="absolute inset-0 z-0">
        <TreeCanvas weather={weather ?? undefined} />
      </div>

      {/* Weather effects overlay */}
      {weather && (
        <WeatherEffects
          weatherType={weather.weatherType}
          isDay={weather.isDay}
          windSpeed={weather.windspeed}
          temperature={weather.temperature}
        />
      )}

      {/* Weather widget — top right corner */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute top-20 right-4 md:right-8 z-20 flex flex-col rounded-xl overflow-hidden"
          style={{
            background: 'rgba(30, 30, 30, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#e8e8e3',
            minWidth: '140px',
          }}
        >
          {/* Main row: icon + temp + condition */}
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-lg leading-none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
              {getWeatherIcon(weather.weatherType, weather.isDay)}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">
                {weather.temperature}°C
              </span>
              <span className="text-[10px] font-light" style={{ color: 'rgba(232,232,227,0.65)' }}>
                {t(getWeatherTranslationKey(weather.weatherType, weather.isDay))}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Stats row: humidity + wind */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-light" style={{ color: 'rgba(232,232,227,0.6)' }}>
            <span className="flex items-center gap-1">
              <Droplets size={10} style={{ color: 'rgba(160,200,255,0.7)' }} />
              {weather.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind size={10} style={{ color: 'rgba(180,220,180,0.7)' }} />
              {getWindArrow(weather.winddirection)} {weather.windspeed}
            </span>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4" style={{ maxWidth: '800px' }}>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easing }}
          className="font-display leading-[1.1] tracking-tight"
          style={{
            color: 'var(--text-primary)',
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          }}
        >
          {t('hero.heading')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: easing }}
          className="font-light mt-6 leading-[1.6]"
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            maxWidth: '560px',
            margin: '24px auto 0',
          }}
        >
          {t('hero.subheading')}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: easing }}
          className="mt-10"
        >
          <button
            onClick={handleCtaClick}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all duration-300 hover:scale-105"
            style={{
              background: 'var(--accent-green)',
              color: '#fff',
              fontSize: '15px',
              letterSpacing: '0.02em',
            }}
          >
            {t('hero.cta')}
            <ChevronDown size={18} />
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} style={{ color: 'var(--text-tertiary)' }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
