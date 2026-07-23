import { useState, useEffect, useCallback, useRef } from 'react';
import CampaignDetailModal from '@/components/CampaignDetailModal';
import { useLanguage } from '@/hooks/useLanguage';
import CampaignCard from '@/components/CampaignCard';
import { trpc } from '@/lib/trpc';
import { formatCampaignDateTime } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin } from 'lucide-react';

// Fix Leaflet default marker icons in bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error - Leaflet internal
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import type { Campaign } from '@/types/campaign';

// Create custom colored marker icon
function createCustomIcon(color: string, isLight: boolean): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 28px; height: 28px; border-radius: 50%;
        background: ${color};
        border: 3px solid ${isLight ? '#fff' : '#1a1c18'};
        box-shadow: 0 0 0 2px ${color}40, 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${isLight ? '#fff' : '#1a1c18'};"></div>
      </div>
      <div style="
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 40px; height: 40px; border-radius: 50%;
        border: 2px solid ${color}; opacity: 0.3;
        animation: mapPulse 2s ease-out infinite;
        pointer-events: none;
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Map controller component to handle programmatic map changes
function MapController({
  selectedId,
  onReady,
  campaigns,
}: {
  selectedId: number | null;
  onReady: (map: L.Map) => void;
  campaigns: Campaign[];
}) {
  const map = useMap();
  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      onReady(map);
    }
  }, [map, onReady]);

  useEffect(() => {
    if (selectedId) {
      const campaign = campaigns.find((c) => c.id === selectedId);
      if (campaign?.mapX && campaign?.mapY) {
        map.flyTo([campaign.mapX, campaign.mapY], 15, { duration: 1 });
      }
    }
  }, [selectedId, map, campaigns]);

  return null;
}

function getCampaignTitle(campaign: Campaign, lang: string): string {
  if (lang === 'fr' && campaign.titleFr) return campaign.titleFr;
  if (lang === 'ar' && campaign.titleAr) return campaign.titleAr;
  return campaign.titleEn;
}

function getCampaignLocation(campaign: Campaign, lang: string): string {
  if (lang === 'fr' && campaign.locationFr) return campaign.locationFr;
  if (lang === 'ar' && campaign.locationAr) return campaign.locationAr;
  return campaign.locationEn;
}

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
  const displayValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center rounded font-mono font-bold"
        style={{
          width: 'clamp(36px, 6vw, 56px)',
          height: 'clamp(36px, 6vw, 56px)',
          background: 'var(--accent-green)',
          color: '#fff',
          fontSize: 'clamp(0.875rem, 2vw, 1.25rem)',
        }}
      >
        {String(displayValue).padStart(2, '0')}
      </div>
      <span
        className="text-[9px] uppercase tracking-wider mt-1 font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </div>
  );
}

function CampaignCountdownBanner({
  campaign,
  lang,
  t,
}: {
  campaign: Campaign & { eventDate?: number | Date | null };
  lang: string;
  t: (key: string) => string;
}) {
  // Handle both Drizzle Date object and API number/string timestamp
  const eventTimestamp = (() => {
    if (!campaign.eventDate) return null;
    if (campaign.eventDate instanceof Date) return campaign.eventDate.getTime();
    if (typeof campaign.eventDate === 'number') return campaign.eventDate * 1000;
    // Handle string timestamps (e.g., from JSON serialization)
    const parsed = Number(campaign.eventDate);
    return isNaN(parsed) ? null : parsed * 1000;
  })();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    eventTimestamp ? calculateTimeLeft(new Date(eventTimestamp)) : { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );

  useEffect(() => {
    if (!eventTimestamp) return;
    const target = new Date(eventTimestamp);
    const update = () => setTimeLeft(calculateTimeLeft(target));
    const immediate = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [eventTimestamp]);

  const title = lang === 'fr' && campaign.titleFr
    ? campaign.titleFr
    : lang === 'ar' && campaign.titleAr
    ? campaign.titleAr
    : campaign.titleEn;

  const location = lang === 'fr' && campaign.locationFr
    ? campaign.locationFr
    : lang === 'ar' && campaign.locationAr
    ? campaign.locationAr
    : campaign.locationEn;

  const dateStr = eventTimestamp
    ? formatCampaignDateTime(new Date(eventTimestamp), lang, campaign.date)
    : campaign.date;

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div
      className="rounded-xl overflow-hidden mb-8"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <Calendar size={14} style={{ color: 'var(--accent-green)' }} />
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent-green)' }}>
          {t('countdown.next_campaign')}
        </span>
      </div>
      <div className="px-4 py-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="flex-1 text-center sm:text-left">
          <h3
            className="font-display leading-tight"
            style={{ color: 'var(--text-primary)', fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
          >
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-2 justify-center sm:justify-start">
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={12} style={{ color: 'var(--accent-green)' }} />
              {location}
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Clock size={12} style={{ color: 'var(--accent-green)' }} />
              {dateStr}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isExpired ? (
            <div
              className="px-4 py-2 rounded-lg font-medium text-sm"
              style={{ background: 'var(--accent-green)', color: '#fff' }}
            >
              {t('countdown.started')}
            </div>
          ) : (
            <>
              <CountdownUnit value={timeLeft.days} label={t('countdown.days')} />
              <span className="text-lg font-bold" style={{ color: 'var(--text-tertiary)', marginTop: '-14px' }}>:</span>
              <CountdownUnit value={timeLeft.hours} label={t('countdown.hours')} />
              <span className="text-lg font-bold" style={{ color: 'var(--text-tertiary)', marginTop: '-14px' }}>:</span>
              <CountdownUnit value={timeLeft.minutes} label={t('countdown.minutes')} />
              <span className="text-lg font-bold" style={{ color: 'var(--text-tertiary)', marginTop: '-14px' }}>:</span>
              <CountdownUnit value={timeLeft.seconds} label={t('countdown.seconds')} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CampaignsSection() {
  const { t, lang } = useLanguage();
  const { data: apiCampaigns, isLoading } = trpc.campaign.list.useQuery();
  const { data: nextCampaign } = trpc.campaign.nextCampaign.useQuery();
  const [isLight, setIsLight] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [detailModalCampaign, setDetailModalCampaign] = useState<Campaign | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const campaigns = apiCampaigns || [];

  useEffect(() => {
    const checkTheme = () => setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkerClick = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign.id);
    setDetailModalCampaign(campaign);
    const el = document.getElementById(`campaign-card-${campaign.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'transform 0.3s ease';
      el.style.transform = 'scale(1.02)';
      setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo([33.8933, -5.5582], 13, { duration: 1 });
    }
  }, []);

  const handleCardClick = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign.id);
    setDetailModalCampaign(campaign);
    if (mapRef.current && campaign.mapX && campaign.mapY) {
      mapRef.current.flyTo([campaign.mapX, campaign.mapY], 15, { duration: 1 });
    }
  }, []);

  // Carousel scroll logic (activated when 5+ campaigns)
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const useCarousel = campaigns.length >= 5;

  const checkScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el || !useCarousel) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, useCarousel, campaigns.length]);

  const scrollCarousel = useCallback((dir: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).getBoundingClientRect().width + 20 : 300;
    el.scrollBy({ left: dir === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <section id="campaigns" style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-surface)' }}>
        <div className="mx-auto text-center" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>{t('campaigns.loading')}</p>
        </div>
      </section>
    );
  }

  if (campaigns.length === 0) {
    return (
      <section id="campaigns" style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-surface)' }}>
        <div className="mx-auto text-center" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
          <h2 className="font-display" style={{ color: 'var(--text-primary)', fontSize: 'clamp(24px, 3vw, 32px)' }}>
            {t('campaigns.heading')}
          </h2>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>{t('campaigns.no_campaigns')}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="campaigns" style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-surface)' }}>
      <style>{`
        @keyframes mapPulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        /* Map wrapper creates isolated stacking context */
        #campaigns .relative.rounded-xl.overflow-hidden {
          isolation: isolate;
          z-index: 1;
        }
        .leaflet-container {
          background: ${isLight ? '#e0dcd4' : '#1a1d18'} !important;
          font-family: 'Inter', system-ui, sans-serif;
          z-index: 1 !important;
        }
        /* Force ALL leaflet elements to low z-index */
        .leaflet-pane,
        .leaflet-tile-pane,
        .leaflet-overlay-pane,
        .leaflet-shadow-pane,
        .leaflet-marker-pane,
        .leaflet-tooltip-pane,
        .leaflet-popup-pane,
        .leaflet-map-pane,
        .leaflet-map-pane canvas,
        .leaflet-map-pane svg,
        .leaflet-tile,
        .leaflet-tile-container {
          z-index: 1 !important;
        }
        .leaflet-control,
        .leaflet-top,
        .leaflet-bottom,
        .leaflet-control-zoom,
        .leaflet-control-layers,
        .leaflet-bar,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          z-index: 2 !important;
        }
        .leaflet-popup-content-wrapper {
          background: ${isLight ? '#fff' : '#1e211c'} !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        }
        .leaflet-popup-tip {
          background: ${isLight ? '#fff' : '#1e211c'} !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
          color: ${isLight ? '#1a1a1a' : '#f5f5f0'} !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <div className="mx-auto" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
        {/* Countdown Banner */}
        {nextCampaign && nextCampaign.eventDate && (
          <CampaignCountdownBanner campaign={nextCampaign} lang={lang} t={t} />
        )}

        {/* Section header */}
        <div className="mb-8 text-center">
          <h2
            className="font-display leading-[1.1]"
            style={{ color: 'var(--text-primary)', fontSize: 'clamp(24px, 3vw, 32px)', letterSpacing: '-0.02em' }}
          >
            {t('campaigns.heading')}
          </h2>
          <p className="text-sm font-light mt-2 mx-auto max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            {t('campaigns.subheading')}
          </p>
        </div>

        {/* Map container */}
        <div
          className="relative rounded-xl overflow-hidden mb-10"
          style={{
            border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}`,
            position: 'relative',
          }}
        >
          {/* Map header */}
          <div className="absolute top-3 left-3 z-[5] pointer-events-none">
            <div
              className="px-2.5 py-1 rounded font-mono text-[9px] uppercase tracking-widest"
              style={{
                background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(30,33,28,0.9)',
                color: isLight ? '#5a5548' : '#6a7a5a',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)'}`,
                backdropFilter: 'blur(8px)',
              }}
            >
              {t('campaigns.discover_title')}
            </div>
          </div>

          {/* Map controls: zoom + theme toggle */}
          <div className="absolute top-1/2 -translate-y-1/2 left-3 z-[999] flex flex-col gap-1.5">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{
                background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(30,33,28,0.9)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)'}`,
                color: isLight ? '#5a5548' : '#6a7a5a',
              }}
              title="Zoom in"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{
                background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(30,33,28,0.9)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)'}`,
                color: isLight ? '#5a5548' : '#6a7a5a',
              }}
              title="Zoom out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            </button>
            <button
              onClick={handleResetView}
              className="w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{
                background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(30,33,28,0.9)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)'}`,
                color: isLight ? '#5a5548' : '#6a7a5a',
              }}
              title="Reset view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
            </button>
          </div>

          {/* Leaflet Map */}
          <MapContainer
            center={[33.8933, -5.5582]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ width: '100%', height: 'clamp(350px, 50vh, 500px)' }}
            zoomControl={false}
          >
            <TileLayer
              attribution=''
              url={
                isLight
                  ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              }
            />
            <MapController
              selectedId={selectedCampaign}
              onReady={(map) => { mapRef.current = map; }}
              campaigns={campaigns}
            />
            {campaigns.filter(c => c.mapX && c.mapY).map((campaign) => (
              <Marker
                key={campaign.id}
                position={[campaign.mapX!, campaign.mapY!]}
                icon={createCustomIcon('#6B8E5A', isLight)}
                eventHandlers={{
                  click: () => handleMarkerClick(campaign),
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '180px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6B8E5A',
                        marginBottom: '4px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {campaign.date}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isLight ? '#1a1a1a' : '#f5f5f0',
                        marginBottom: '2px',
                      }}
                    >
                      {getCampaignTitle(campaign, lang)}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: isLight ? '#555' : '#9e9e9e',
                        marginBottom: '8px',
                      }}
                    >
                      {getCampaignLocation(campaign, lang)}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: isLight ? '#999' : '#666',
                        marginBottom: '8px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {campaign.mapX?.toFixed(4)}, {campaign.mapY?.toFixed(4)}
                    </div>
                    <button
                      onClick={() => handleMarkerClick(campaign)}
                      style={{
                        background: '#6B8E5A',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

        </div>

        {/* Campaign cards: horizontal scroll carousel when 5+, otherwise grid */}
        {useCarousel ? (
          <div className="relative">
            {/* Left arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scrollCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(30,33,28,0.95)',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
                  color: 'var(--text-secondary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {/* Right arrow */}
            {canScrollRight && (
              <button
                onClick={() => scrollCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(30,33,28,0.95)',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
                  color: 'var(--text-secondary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                aria-label="Scroll right"
              >
                <ChevronRight size={20} />
              </button>
            )}
            {/* Scrollable track */}
            <div
              ref={carouselRef}
              className="flex gap-5 overflow-x-auto pb-4"
              style={{
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'thin',
                scrollbarColor: `${isLight ? 'rgba(0,0,0,0.2) transparent' : 'rgba(255,255,255,0.15) transparent'}`,
                paddingLeft: 'var(--page-margin)',
                paddingRight: 'var(--page-margin)',
                marginLeft: `calc(-1 * var(--page-margin))`,
                marginRight: `calc(-1 * var(--page-margin))`,
              }}
            >
              {campaigns.map((campaign, index) => (
                <div
                  key={campaign.id}
                  id={`campaign-card-${campaign.id}`}
                  onClick={() => handleCardClick(campaign)}
                  className="flex-shrink-0"
                  style={{
                    width: '280px',
                    scrollSnapAlign: 'start',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
                    cursor: 'pointer',
                  }}
                >
                  <CampaignCard
                    campaign={campaign}
                    isActive={false}
                    isDimmed={false}
                    filterActive={false}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {campaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                id={`campaign-card-${campaign.id}`}
                onClick={() => handleCardClick(campaign)}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
                  cursor: 'pointer',
                }}
              >
                <CampaignCard
                  campaign={campaign}
                  isActive={false}
                  isDimmed={false}
                  filterActive={false}
                />
              </div>
            ))}
          </div>
        )}

        {/* Campaign Detail Modal */}
        {detailModalCampaign && (
          <CampaignDetailModal
            key={detailModalCampaign.id}
            campaign={detailModalCampaign}
            onClose={() => setDetailModalCampaign(null)}
          />
        )}
      </div>
    </section>
  );
}
