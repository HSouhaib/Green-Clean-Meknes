import { useLanguage } from "@/hooks/useLanguage";
import { roleLabelByName } from "@/lib/roleLabels";
import { trpc } from "@/lib/trpc";
import { X, BadgeCheck, Calendar, MapPin, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { formatCampaignDateTime } from "@/lib/utils";
import type { RouterOutputs } from "@/lib/trpc";

type User = NonNullable<RouterOutputs["auth"]["me"]>;
type Registration = RouterOutputs["campaign"]["myRegistrations"][number];

interface UserBadgeModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

function getCampaignTitle(
  campaign: Registration["campaign"],
  lang: string
): string {
  if (!campaign) return "";
  if (lang === "fr" && campaign.titleFr) return campaign.titleFr;
  if (lang === "ar" && campaign.titleAr) return campaign.titleAr;
  return campaign.titleEn;
}

function getCampaignLocation(
  campaign: Registration["campaign"],
  lang: string
): string {
  if (!campaign) return "";
  if (lang === "fr" && campaign.locationFr) return campaign.locationFr;
  if (lang === "ar" && campaign.locationAr) return campaign.locationAr;
  return campaign.locationEn;
}

function getBadgeId(user: User): string {
  const prefix = "GCM";
  const year = new Date(user.createdAt).getFullYear();
  const id = String(user.id).padStart(4, "0");
  return `${prefix}-${year}-${id}`;
}

export default function UserBadgeModal({
  user,
  open,
  onClose,
}: UserBadgeModalProps) {
  const { t, lang } = useLanguage();
  const [selectedRegId, setSelectedRegId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const { data: registrations, isLoading: regsLoading } =
    trpc.campaign.myRegistrations.useQuery(undefined, { enabled: open });

  const validRegistrations = useMemo(
    () => (registrations ?? []).filter(r => r.campaign),
    [registrations]
  );

  const selectedReg = useMemo(
    () =>
      validRegistrations.find(r => r.id === selectedRegId) ||
      validRegistrations[0] ||
      null,
    [validRegistrations, selectedRegId]
  );

  const selectedCampaign = selectedReg?.campaign ?? null;
  const campaignId = selectedCampaign?.id ?? 0;

  const { data: badge, isLoading: badgeLoading } = trpc.badge.myBadge.useQuery(
    { campaignId },
    { enabled: open && campaignId > 0 }
  );

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-surface-light)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <div className="text-center mb-5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(107,142,90,0.15)" }}
            >
              <BadgeCheck size={24} style={{ color: "var(--accent-green)" }} />
            </div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("user_badge.title")}
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("user_badge.subtitle")}
            </p>
          </div>

          {/* Campaign selector */}
          {validRegistrations.length > 1 && (
            <div className="relative mb-5">
              <button
                type="button"
                onClick={() => setDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border-none cursor-pointer transition-colors"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--bg-surface-light)",
                }}
              >
                <span className="flex items-center gap-2 truncate">
                  <Calendar
                    size={14}
                    style={{ color: "var(--accent-green)" }}
                  />
                  <span className="truncate">
                    {selectedCampaign
                      ? getCampaignTitle(selectedCampaign, lang)
                      : t("user_badge.select_campaign")}
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  style={{ color: "var(--text-tertiary)" }}
                />
              </button>
              {dropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-20 max-h-60 overflow-y-auto"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--bg-surface-light)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                  }}
                >
                  {validRegistrations.map(reg => {
                    const campaign = reg.campaign!;
                    const title = getCampaignTitle(campaign, lang);
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => {
                          setSelectedRegId(reg.id);
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {regsLoading ? (
            <div
              className="rounded-2xl p-8 text-center animate-pulse"
              style={{ background: "var(--bg-primary)" }}
            >
              <div
                className="h-4 w-32 mx-auto rounded"
                style={{ background: "var(--bg-surface-light)" }}
              />
            </div>
          ) : validRegistrations.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--bg-surface-light)",
                color: "var(--text-secondary)",
              }}
            >
              <Calendar
                size={32}
                className="mx-auto mb-3"
                style={{ color: "var(--text-tertiary)" }}
              />
              <p className="text-sm">{t("user_badge.no_campaigns")}</p>
            </div>
          ) : (
            <>
              {/* Badge card - forced LTR so layout is identical in all languages */}
              <div
                dir="ltr"
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#f5f5f0",
                  border: "1px solid #e5e5df",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  maxWidth: "360px",
                  margin: "0 auto",
                  direction: "ltr",
                }}
              >
                {/* Top stripe */}
                <div
                  className="h-2"
                  style={{ background: isAdmin ? "#c47850" : "#6B8E5A" }}
                />

                <div className="p-6">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between mb-6"
                    style={{ flexDirection: "row" }}
                  >
                    <span className="inline-flex items-center gap-2 no-underline">
                      <svg
                        width={28}
                        height={28}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ color: "#6B8E5A" }}
                      >
                        <path
                          d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="flex flex-col leading-none">
                        <span
                          className="font-display tracking-tight text-[15px]"
                          style={{ color: "#1a1a1a" }}
                        >
                          GREEN
                        </span>
                        <span
                          className="uppercase font-medium text-[8px] tracking-[0.16em]"
                          style={{ color: "#6B8E5A" }}
                        >
                          Clean Meknes
                        </span>
                      </span>
                    </span>
                    <span
                      className="text-[10px] font-mono uppercase tracking-widest"
                      style={{ color: "#6b6b6b" }}
                    >
                      {getBadgeId(user)}
                    </span>
                  </div>

                  {/* QR */}
                  <div className="flex justify-center mb-5">
                    {badgeLoading || !badge ? (
                      <div
                        className="w-44 h-44 rounded-xl animate-pulse"
                        style={{ background: "#e5e5df" }}
                      />
                    ) : (
                      <div
                        className="p-3 rounded-xl"
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e5df",
                        }}
                      >
                        <img
                          src={badge.qrDataUrl}
                          alt={t("badge.qr_alt")}
                          className="w-40 h-40 rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex flex-col items-center text-center mb-5">
                    <div
                      className="w-16 h-16 rounded-full p-0.5 mb-3"
                      style={{
                        background: isAdmin ? "#c47850" : "#6B8E5A",
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                        style={{ background: "#ffffff" }}
                      >
                        {user.avatar && !avatarError ? (
                          <img
                            src={user.avatar}
                            alt=""
                            crossOrigin="anonymous"
                            onError={() => setAvatarError(true)}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="text-lg font-medium"
                            style={{ color: "#6b6b6b" }}
                          >
                            {(user.name?.trim()?.[0] ?? "").toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "#1a1a1a" }}
                    >
                      {user.name}
                    </h3>

                    <span
                      className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: isAdmin ? "#f3e5dc" : "#e8efe4",
                        color: isAdmin ? "#9c5a32" : "#4a6b3a",
                      }}
                    >
                      {roleLabelByName(user.role, undefined, lang, t)}
                    </span>
                  </div>

                  {/* Campaign info */}
                  {selectedCampaign && (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e5df",
                      }}
                    >
                      <p
                        className="text-sm font-medium mb-2"
                        style={{ color: "#1a1a1a" }}
                      >
                        {getCampaignTitle(selectedCampaign, lang)}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <span
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "#4a4a4a" }}
                        >
                          <Calendar size={12} style={{ color: "#6B8E5A" }} />
                          {formatCampaignDateTime(
                            selectedCampaign.eventDate,
                            lang,
                            selectedCampaign.date
                          )}
                        </span>
                        <span
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "#4a4a4a" }}
                        >
                          <MapPin size={12} style={{ color: "#6B8E5A" }} />
                          {getCampaignLocation(selectedCampaign, lang)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
