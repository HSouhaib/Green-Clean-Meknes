import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { X, Copy, CheckCircle2, AlertCircle, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CampaignBadgeModalProps {
  campaignId: number;
  campaignTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function CampaignBadgeModal({
  campaignId,
  campaignTitle,
  open,
  onClose,
}: CampaignBadgeModalProps) {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = trpc.badge.myBadge.useQuery(
    { campaignId },
    { enabled: open && campaignId > 0 }
  );

  if (!open) return null;

  const handleCopy = async () => {
    if (!data?.token) return;
    try {
      await navigator.clipboard.writeText(data.token);
      setCopied(true);
      toast.success(t("badge.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("badge.copy_failed"));
    }
  };

  const title =
    (lang === "fr" && data?.campaign.titleFr) ||
    (lang === "ar" && data?.campaign.titleAr) ||
    data?.campaign.titleEn ||
    campaignTitle;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--bg-surface-light)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors border-none cursor-pointer"
          style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}
        >
          <X size={16} />
        </button>

        <div className="p-6 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(107,142,90,0.15)" }}
          >
            <BadgeCheck size={24} style={{ color: "var(--accent-green)" }} />
          </div>

          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("badge.title")}
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {title}
          </p>

          {isLoading && (
            <p
              className="text-sm mt-6"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("badge.loading")}
            </p>
          )}

          {error && (
            <div
              className="mt-6 flex items-center justify-center gap-2 text-sm"
              style={{ color: "#ef4444" }}
            >
              <AlertCircle size={16} />
              {error.message}
            </div>
          )}

          {data && (
            <>
              <div
                className="mt-6 p-3 rounded-xl inline-block"
                style={{ background: "var(--bg-surface)" }}
              >
                <img
                  src={data.qrDataUrl}
                  alt={t("badge.qr_alt")}
                  className="w-48 h-48 rounded-lg"
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    data.attended ? "" : ""
                  }`}
                  style={{
                    background: data.attended
                      ? "rgba(107,142,90,0.15)"
                      : "rgba(255,255,255,0.06)",
                    color: data.attended
                      ? "var(--accent-green)"
                      : "var(--text-tertiary)",
                  }}
                >
                  {data.attended
                    ? t("badge.attended")
                    : t("badge.not_attended")}
                </span>
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {data.user.role}
                </span>
              </div>

              <div
                className="mt-5 flex items-center gap-2 rounded-lg p-2"
                style={{ background: "var(--bg-surface)" }}
              >
                <code
                  className="flex-1 text-[10px] font-mono truncate text-left"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {data.token}
                </code>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer transition-colors"
                  style={{
                    background: copied
                      ? "rgba(107,142,90,0.15)"
                      : "var(--bg-surface-light)",
                    color: copied
                      ? "var(--accent-green)"
                      : "var(--text-primary)",
                  }}
                >
                  {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {copied ? t("badge.copied") : t("badge.copy")}
                </button>
              </div>

              <p
                className="text-[11px] mt-4"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t("badge.hint")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
