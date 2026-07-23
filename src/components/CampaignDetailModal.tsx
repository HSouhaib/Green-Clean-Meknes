import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from "@/hooks/useAuth";
import { useCampaignRegistration } from "@/hooks/useCampaignRegistration";
import ShareButton from "@/components/ShareButton";
import GuestRegisterModal from "./GuestRegisterModal";
import CampaignCountdown from "./CampaignCountdown";
import {
  X,
  MapPin,
  Calendar,
  Users,
  Trash2,
  Sprout,
  ImageOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Campaign } from "@/types/campaign";
import { useState } from "react";
import { formatCampaignDateTime } from "@/lib/utils";

function CampaignImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <ImageOff size={40} style={{ color: "var(--text-tertiary)" }} />
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

interface CampaignDetailModalProps {
  campaign: Campaign;
  onClose: () => void;
}

function getCampaignTitle(campaign: Campaign, lang: string): string {
  if (lang === "fr" && campaign.titleFr) return campaign.titleFr;
  if (lang === "ar" && campaign.titleAr) return campaign.titleAr;
  return campaign.titleEn;
}

function getCampaignLocation(campaign: Campaign, lang: string): string {
  if (lang === "fr" && campaign.locationFr) return campaign.locationFr;
  if (lang === "ar" && campaign.locationAr) return campaign.locationAr;
  return campaign.locationEn;
}

function getCampaignDescription(campaign: Campaign, lang: string): string {
  if (lang === "fr" && campaign.descriptionFr) return campaign.descriptionFr;
  if (lang === "ar" && campaign.descriptionAr) return campaign.descriptionAr;
  return campaign.descriptionEn;
}

export default function CampaignDetailModal({
  campaign,
  onClose,
}: CampaignDetailModalProps) {
  const { t, lang, dir } = useLanguage();
  const { user } = useAuth();
  const isRtl = dir === "rtl";
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const images = campaign.galleryImages ?? [];
  const showImagePlaceholder = images.length === 0;

  const { isRegistered, count, isLoading, register, unregister } =
    useCampaignRegistration(campaign.id);

  const isClosed =
    campaign.status === "completed" || campaign.status === "cancelled";
  const title = getCampaignTitle(campaign, lang);
  const location = getCampaignLocation(campaign, lang);
  const description = getCampaignDescription(campaign, lang);
  const eventDateTime = formatCampaignDateTime(campaign.eventDate, lang, campaign.date);

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    if (isRegistered) {
      // Only logged-in users can unregister
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

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-surface-light)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{
            background: "rgba(0,0,0,0.4)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>

        {/* Image */}
        <div className="relative w-full" style={{ height: "200px" }}>
          {showImagePlaceholder ? (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ background: "var(--bg-surface)" }}
            >
              <ImageOff size={40} style={{ color: "var(--text-tertiary)" }} />
              <span
                className="text-[12px] font-medium px-4 text-center"
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
                    onClick={() =>
                      setImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </>
          )}
          {/* Date badge */}
          <div
            className="absolute top-4 left-4 px-3 py-1.5 rounded font-mono text-[10px] uppercase"
            style={{
              background: "var(--accent-green)",
              color: "var(--bg-primary)",
            }}
          >
            <Calendar size={12} className="inline mr-1" />
            {eventDateTime}
          </div>
        </div>

        {/* Gallery thumbnails */}
        {images.length > 1 && (
          <div
            className="flex gap-2 px-4 pt-3 overflow-x-auto"
            style={{
              background: "var(--bg-surface)",
              borderBottom: "1px solid var(--bg-surface-light)",
            }}
          >
            {images.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => setImageIndex(i)}
                className="relative shrink-0 rounded overflow-hidden"
                style={{
                  width: "64px",
                  height: "48px",
                  outline:
                    i === imageIndex ? "2px solid var(--accent-green)" : "none",
                  outlineOffset: "2px",
                }}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {/* Countdown bar */}
        {campaign.eventDate && !isClosed && (
          <div
            className="flex items-center justify-center py-3 px-4"
            style={{
              background: "var(--bg-surface)",
              borderBottom: "1px solid var(--bg-surface-light)",
            }}
          >
            <CampaignCountdown
              eventDate={campaign.eventDate}
              compact
              labels={{
                days: t("countdown.days"),
                hours: t("countdown.hours"),
                minutes: t("countdown.minutes"),
                seconds: t("countdown.seconds"),
                started: t("countdown.started"),
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <div className="flex items-start justify-between gap-3">
            <h2
              className="font-display leading-tight"
              style={{
                color: "var(--text-primary)",
                fontSize: "22px",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h2>
            <span
              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium capitalize"
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

          {/* Location */}
          <p
            className="text-sm font-light mt-2 flex items-center gap-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <MapPin size={14} />
            {location}
          </p>

          {/* Description */}
          <p
            className="text-sm font-light mt-4 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {description}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-5">
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Users size={14} />
              <span>
                {count} {t("campaigns.registered_count")}
              </span>
            </div>
            {campaign.mapX && campaign.mapY && (
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                <MapPin size={14} />
                <span>
                  {campaign.mapX.toFixed(4)}, {campaign.mapY.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Impact stats row */}
          {((campaign.statsWasteKg ?? 0) > 0 ||
            (campaign.statsTrees ?? 0) > 0 ||
            (campaign.statsVolunteers ?? 0) > 0 ||
            (campaign.statsNeighborhoods ?? 0) > 0) && (
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {(campaign.statsWasteKg ?? 0) > 0 && (
                <div
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Trash2 size={14} />
                  <span>
                    {campaign.statsWasteKg ?? 0} {t("campaigns.stats.waste")}
                  </span>
                </div>
              )}
              {(campaign.statsTrees ?? 0) > 0 && (
                <div
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Sprout size={14} />
                  <span>
                    {campaign.statsTrees ?? 0} {t("campaigns.stats.trees")}
                  </span>
                </div>
              )}
              {(campaign.statsVolunteers ?? 0) > 0 && (
                <div
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Users size={14} />
                  <span>
                    {campaign.statsVolunteers ?? 0}{" "}
                    {t("campaigns.stats.volunteers")}
                  </span>
                </div>
              )}
              {(campaign.statsNeighborhoods ?? 0) > 0 && (
                <div
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <MapPin size={14} />
                  <span>
                    {campaign.statsNeighborhoods ?? 0}{" "}
                    {t("campaigns.stats.neighborhoods")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div
            className="mt-5"
            style={{ borderTop: "1px solid var(--bg-surface-light)" }}
          />

          {/* Actions row */}
          <div
            className={`flex items-center mt-5 ${isRtl ? "flex-row-reverse" : ""}`}
          >
            {/* Register button */}
            <button
              onClick={handleRegister}
              disabled={isLoading || isClosed}
              className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-50"
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

            {/* Share buttons */}
            <div
              className={`flex items-center gap-3 ${isRtl ? "mr-auto" : "ml-auto"}`}
            >
              <span
                className="text-xs font-light"
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
                size={18}
              />
              <ShareButton
                platform="facebook"
                campaign={{
                  title,
                  date: campaign.date,
                  description,
                  slug: campaign.slug,
                }}
                size={18}
              />
              <ShareButton
                platform="instagram"
                campaign={{
                  title,
                  date: campaign.date,
                  description,
                  slug: campaign.slug,
                }}
                size={18}
              />
              <ShareButton
                platform="tiktok"
                campaign={{
                  title,
                  date: campaign.date,
                  description,
                  slug: campaign.slug,
                }}
                size={18}
              />
            </div>
          </div>
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
