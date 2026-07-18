import { useLanguage } from '@/hooks/useLanguage';
import { useEffect, useRef, useState } from 'react';
import { Wind, AlertTriangle, CheckCircle, Info, BookOpen, Gauge } from 'lucide-react';

interface AirQualityData {
  aqi: number;
  pm2_5: number;
  pm10: number;
  co: number;
  no2: number;
  so2: number;
  o3: number;
  timestamp: string;
  isSimulated: boolean;
}

interface AqiLevel {
  max: number;
  label: string;
  color: string;
  icon: React.ReactNode;
  advice: string;
}

function getAqiLevels(t: (key: string) => string): AqiLevel[] {
  return [
    { max: 50, label: t('air_quality.level_good'), color: '#22c55e', icon: <CheckCircle size={14} />, advice: t('air_quality.advice_good') },
    { max: 100, label: t('air_quality.level_moderate'), color: '#eab308', icon: <Info size={14} />, advice: t('air_quality.advice_moderate') },
    { max: 150, label: t('air_quality.level_sensitive'), color: '#f97316', icon: <AlertTriangle size={14} />, advice: t('air_quality.advice_sensitive') },
    { max: 200, label: t('air_quality.level_unhealthy'), color: '#ef4444', icon: <AlertTriangle size={14} />, advice: t('air_quality.advice_unhealthy') },
    { max: 300, label: t('air_quality.level_very_unhealthy'), color: '#a855f7', icon: <AlertTriangle size={14} />, advice: t('air_quality.advice_unhealthy') },
    { max: 999, label: t('air_quality.level_hazardous'), color: '#7f1d1d', icon: <AlertTriangle size={14} />, advice: t('air_quality.advice_unhealthy') },
  ];
}

function getAqiLevel(aqi: number, t: (key: string) => string): AqiLevel {
  return getAqiLevels(t).find((l) => aqi <= l.max) ?? getAqiLevels(t)[5];
}

function getHealthAdvice(aqi: number, t: (key: string) => string): string {
  if (aqi <= 50) return t('air_quality.advice_good');
  if (aqi <= 100) return t('air_quality.advice_moderate');
  if (aqi <= 150) return t('air_quality.advice_sensitive');
  return t('air_quality.advice_unhealthy');
}

// Simulated fallback data for Meknes (realistic values based on typical Moroccan city air quality)
function getSimulatedData(): AirQualityData {
  const hour = new Date().getHours();
  // Rush hour peaks (8-10am, 6-8pm) have slightly worse AQI
  const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20);
  const baseAqi = isRushHour ? 85 : 65;
  const aqi = Math.round(baseAqi + Math.random() * 20 - 10);

  return {
    aqi: Math.max(20, Math.min(200, aqi)),
    pm2_5: Math.round((aqi * 0.6 + Math.random() * 10) * 10) / 10,
    pm10: Math.round((aqi * 1.2 + Math.random() * 20) * 10) / 10,
    co: Math.round((0.5 + Math.random() * 0.4) * 100) / 100,
    no2: Math.round((15 + Math.random() * 15) * 10) / 10,
    so2: Math.round((5 + Math.random() * 5) * 10) / 10,
    o3: Math.round((30 + Math.random() * 20) * 10) / 10,
    timestamp: new Date().toISOString(),
    isSimulated: true,
  };
}

async function fetchAirQuality(): Promise<AirQualityData> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=33.8933&longitude=-5.5582&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=Africa%2FCasablanca',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const current = data.current;
    if (!current) throw new Error('No current data');

    return {
      aqi: current.us_aqi ?? 0,
      pm2_5: current.pm2_5 ?? 0,
      pm10: current.pm10 ?? 0,
      co: current.carbon_monoxide ?? 0,
      no2: current.nitrogen_dioxide ?? 0,
      so2: current.sulphur_dioxide ?? 0,
      o3: current.ozone ?? 0,
      timestamp: new Date().toISOString(),
      isSimulated: false,
    };
  } catch {
    return getSimulatedData();
  }
}

export default function AirQualitySection() {
  const { t } = useLanguage();
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await fetchAirQuality();
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    }
    load();

    return () => { cancelled = true; };
  }, [isVisible]);

  const aqiInfo = data ? getAqiLevel(data.aqi, t) : null;
  const aqiLevels = getAqiLevels(t);

  const pollutants = data ? [
    { label: 'PM2.5', value: data.pm2_5, unit: 'µg/m³', desc: t('air_quality.pm25_desc') },
    { label: 'PM10', value: data.pm10, unit: 'µg/m³', desc: t('air_quality.pm10_desc') },
    { label: 'NO₂', value: data.no2, unit: 'µg/m³', desc: t('air_quality.no2_desc') },
    { label: 'O₃', value: data.o3, unit: 'µg/m³', desc: t('air_quality.o3_desc') },
  ] : [];

  return (
    <section
      id="air-quality"
      ref={ref}
      style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-primary)' }}
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
            {t('air_quality.heading')}
          </h2>
          <p
            className="text-sm font-light mt-2 mx-auto max-w-md"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('air_quality.subheading')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-green)', borderTopColor: 'transparent' }} />
          </div>
        ) : data && aqiInfo ? (
          <div className="space-y-6">
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main AQI Card */}
              <div
                className="lg:col-span-1 p-6 rounded-2xl flex flex-col items-center justify-center text-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
              >
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center mb-4"
                  style={{ background: `${aqiInfo.color}15`, border: `3px solid ${aqiInfo.color}` }}
                >
                  <div>
                    <div
                      className="font-display"
                      style={{ fontSize: '3rem', color: aqiInfo.color, lineHeight: 1 }}
                    >
                      {data.aqi}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      US AQI
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: aqiInfo.color }}>{aqiInfo.icon}</span>
                  <span className="font-medium" style={{ color: aqiInfo.color }}>
                    {aqiInfo.label}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {getHealthAdvice(data.aqi, t)}
                </p>
                {data.isSimulated && (
                  <div className="mt-3 flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <Info size={12} />
                    {t('air_quality.simulated')}
                  </div>
                )}
                <div className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {t('air_quality.updated')}: {new Date(data.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {/* Pollutants Grid */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                {pollutants.map((p) => (
                  <div
                    key={p.label}
                    className="p-4 rounded-xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.label}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {p.unit}
                      </span>
                    </div>
                    <div
                      className="font-display mb-1"
                      style={{ fontSize: '1.75rem', color: 'var(--text-primary)', lineHeight: 1 }}
                    >
                      {p.value}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {p.desc}
                    </p>
                  </div>
                ))}

                {/* Location info */}
                <div
                  className="col-span-2 p-4 rounded-xl flex items-center gap-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                  >
                    <Wind size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t('air_quality.location')}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Meknes, Morocco (33.89°N, 5.56°W)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Educational Guide Toggle */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-surface-light)',
                  color: 'var(--text-secondary)',
                }}
              >
                <BookOpen size={16} />
                {showGuide ? t('air_quality.hide_guide') : t('air_quality.show_guide')}
              </button>
            </div>

            {/* Educational Guide */}
            {showGuide && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AQI Scale */}
                <div
                  className="p-6 rounded-2xl"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Gauge size={18} style={{ color: 'var(--accent-green)' }} />
                    <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t('air_quality.scale_title')}
                    </h3>
                  </div>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {t('air_quality.scale_desc')}
                  </p>
                  <div className="space-y-2">
                    {aqiLevels.map((level) => (
                      <div key={level.max} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: level.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                              {level.label}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {level.max === 999 ? '300+' : `0-${level.max}`}
                            </span>
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {level.advice}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How It Works */}
                <div
                  className="p-6 rounded-2xl"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Info size={18} style={{ color: 'var(--accent-green)' }} />
                    <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t('air_quality.how_title')}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {t('air_quality.what_is_aqi')}
                      </h4>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {t('air_quality.what_is_aqi_desc')}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {t('air_quality.how_measured')}
                      </h4>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {t('air_quality.how_measured_desc')}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {t('air_quality.pollutants_title')}
                      </h4>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {t('air_quality.pollutants_desc')}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {t('air_quality.data_source')}
                      </h4>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {t('air_quality.data_source_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
