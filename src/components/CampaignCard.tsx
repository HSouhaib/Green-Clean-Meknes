import { useLanguage } from '@/hooks/useLanguage';
import ShareButton from "./ShareButton";
import { useCampaignRegistration } from "@/hooks/useCampaignRegistration";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import GuestRegisterModal from "./GuestRegisterModal";
import type { Campaign } from "@/types/campaign";
import { Trash2, Sprout, Users, MapPin, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCampaignTime } from "@/lib/utils";

function CampaignImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <ImageOff size={32} style={{ color: "var(--text-tertiary)" }} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  isActive: boolean;
  isDimmed: boolean;
  filterActive: boolean;
}

export default function CampaignCard({
  campaign,
  isActive,
  isDimmed,
  filterActive,
}: CampaignCardProps) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { isRegistered, count, isLoading, register, unregister } =
    useCampaignRegistration(campaign.id);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const images = campaign.galleryImages ?? [];
  const isClosed =
    campaign.status === "completed" || campaign.status === "cancelled";

  // Pick the right language, fallback to English
  const title =
    (campaign[
      `title${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof Campaign
    ] as string) || campaign.titleEn;
  const location =
    (campaign[
      `location${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof Campaign
    ] as string) || campaign.locationEn;
  const description =
    (campaign[
      `description${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof Campaign
    ] as string) || campaign.descriptionEn;
  const eventTime = formatCampaignTime(campaign.eventDate, lang);

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isClosed || isLoading) return;
    if (isRegistered) {
      // Already registered — offer to unregister (only for logged-in users)
      if (user) {
        unregister();
      }
      return;
    }
    // Logged-in users register instantly; guests use the registration form
    if (user) {
      register();
    } else {
      setGuestModalOpen(true);
    }
  };

  const cardClasses = [
    "campaign-card flex flex-col h-full rounded-lg transition-all duration-300 overflow-hidden",
    filterActive && isActive ? "campaign-card--active" : "",
    filterActive && isDimmed ? "campaign-card--dimmed" : "",
  ].join(" ");

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--bg-surface-light)",
  };

  return (
    <div
      className={cardClasses}
      style={cardStyle}
      id={`campaign-card-${campaign.id}`}
    >
      {/* Image - fixed height at top */}
      <div
        className="relative w-full overflow-hidden group"
        style={{ height: "180px", flexShrink: 0 }}
      >
        {images.length === 0 ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: "var(--bg-surface)" }}
          >
            <ImageOff size={32} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-[11px] font-medium px-3 text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("campaigns.image_missing")}
            </span>
          </div>
        ) : (
          <>
            <CampaignImage
              key={images[imageIndex]}
              src={images[imageIndex]}
              alt={title}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                  aria-label="Next image"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex(i);
                      }}
                      className="w-1.5 h-1.5 rounded-full transition-colors"
                      style={{
                        background:
                          i === imageIndex
                            ? "var(--accent-green)"
                            : "rgba(255,255,255,0.5)",
                      }}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {/* Date badge overlay */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded font-mono text-[10px] uppercase"
          style={{
            background: "var(--accent-green)",
            color: "var(--bg-primary)",
          }}
        >
          {campaign.date}
          {eventTime && (
            <span className="ml-1.5 opacity-90">• {eventTime}</span>
          )}
        </div>
      </div>

      {/* Content - flex grow to fill remaining space */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3
          className="text-[15px] font-medium leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>

        {/* Location */}
        <p
          className="text-[12px] font-light mt-1.5 flex items-center gap-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {location}
        </p>

        {/* Status badge */}
        <div className="mt-2">
          <span
            className="inline-block px-2 py-0.5 rounded text-[10px] font-medium capitalize"
            style={{
              background:
                campaign.status === "ongoing"
                  ? "rgba(58,90,42,0.15)"
                  : campaign.status === "upcoming"
                    ? "rgba(196,90,90,0.15)"
                    : campaign.status === "completed"
                      ? "rgba(74,138,190,0.15)"
                      : "rgba(85,85,85,0.15)",
              color:
                campaign.status === "ongoing"
                  ? "var(--accent-green-light)"
                  : campaign.status === "upcoming"
                    ? "var(--accent-terracotta)"
                    : campaign.status === "completed"
                      ? "#7fb3e0"
                      : "var(--text-tertiary)",
            }}
          >
            {t(`campaigns.status.${campaign.status}`)}
          </span>
        </div>

        {/* Description - line clamped to 3 lines */}
        <p
          className="text-[13px] font-light mt-3 leading-relaxed flex-1"
          style={{
            color: "var(--text-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>

        {/* Impact mini-stats */}
        <div className="flex flex-wrap gap-3 mt-3">
          {(campaign.statsWasteKg ?? 0) > 0 && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Trash2 size={10} /> {campaign.statsWasteKg ?? 0}{" "}
              {t("campaigns.stats.waste")}
            </span>
          )}
          {(campaign.statsTrees ?? 0) > 0 && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Sprout size={10} /> {campaign.statsTrees ?? 0}{" "}
              {t("campaigns.stats.trees")}
            </span>
          )}
          {(campaign.statsVolunteers ?? 0) > 0 && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Users size={10} /> {campaign.statsVolunteers ?? 0}{" "}
              {t("campaigns.stats.volunteers")}
            </span>
          )}
          {(campaign.statsNeighborhoods ?? 0) > 0 && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <MapPin size={10} /> {campaign.statsNeighborhoods ?? 0}{" "}
              {t("campaigns.stats.neighborhoods")}
            </span>
          )}
        </div>

        {/* Registration count */}
        {count > 0 && (
          <p
            className="text-[11px] font-light mt-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            {count} {t("campaigns.registered_count")}
          </p>
        )}

        {/* Share row + Register - always at bottom */}
        <div
          className="mt-4 pt-4 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--bg-surface-light)" }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="text-[11px] font-light"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("campaigns.share")}
            </span>
            <ShareButton
              platform="whatsapp"
              campaign={{
                title,
                date: campaign.date,
                description,
                slug: campaign.slug,
              }}
              size={16}
            />
            <ShareButton
              platform="facebook"
              campaign={{
                title,
                date: campaign.date,
                description,
                slug: campaign.slug,
              }}
              size={16}
            />
            <ShareButton
              platform="instagram"
              campaign={{
                title,
                date: campaign.date,
                description,
                slug: campaign.slug,
              }}
              size={16}
            />
            <ShareButton
              platform="tiktok"
              campaign={{
                title,
                date: campaign.date,
                description,
                slug: campaign.slug,
              }}
              size={16}
            />
          </div>
          <button
            onClick={handleRegister}
            disabled={isLoading || isClosed}
            className="px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-300 hover:opacity-90 disabled:opacity-50"
            style={{
              background:
                isRegistered && !isClosed
                  ? "transparent"
                  : "var(--accent-green)",
              color:
                isRegistered && !isClosed
                  ? "var(--accent-green-light)"
                  : "var(--bg-primary)",
              border:
                isRegistered && !isClosed
                  ? "1px solid var(--accent-green)"
                  : "none",
              opacity: isClosed ? 0.6 : 1,
            }}
          >
            {isLoading
              ? "..."
              : isClosed
                ? t("campaigns.completed")
                : isRegistered
                  ? t("campaigns.registered")
                  : t("campaigns.register")}
          </button>
        </div>
      </div>

      <GuestRegisterModal
        campaignId={campaign.id}
        campaignTitle={title}
        open={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
      />
    </div>
  );
}
