import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import QrScanner from "@/components/QrScanner";
import {
  X,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  User,
  Camera,
  FileText,
} from "lucide-react";
import { useState } from "react";

type VerifyMode = "paste" | "scan";

interface BadgeVerifyModalProps {
  open: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export default function BadgeVerifyModal({
  open,
  onClose,
  onVerified,
}: BadgeVerifyModalProps) {
  const { t, lang } = useLanguage();
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<VerifyMode>("paste");
  const [scanError, setScanError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const verify = trpc.badge.verify.useMutation({
    onSuccess: () => {
      utils.badge.listAttendance.invalidate();
      onVerified?.();
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    verify.mutate({ token: token.trim() });
  };

  const handleScan = (scannedToken: string) => {
    setToken(scannedToken);
    setMode("paste");
    verify.mutate({ token: scannedToken });
  };

  const campaignTitle =
    (lang === "fr" && verify.data?.campaign?.titleFr) ||
    (lang === "ar" && verify.data?.campaign?.titleAr) ||
    verify.data?.campaign?.titleEn ||
    "";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
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

        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(107,142,90,0.15)" }}
            >
              <ScanLine size={20} style={{ color: "var(--accent-green)" }} />
            </div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("badge.verify_title")}
            </h2>
          </div>

          <div
            className="flex p-1 rounded-full mb-4"
            style={{ background: "var(--bg-surface)" }}
          >
            <button
              type="button"
              onClick={() => setMode("paste")}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-medium border-none cursor-pointer transition-colors"
              style={{
                background:
                  mode === "paste" ? "var(--bg-surface-light)" : "transparent",
                color:
                  mode === "paste"
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
              }}
            >
              <FileText size={14} />
              {t("badge.paste_token")}
            </button>
            <button
              type="button"
              onClick={() => setMode("scan")}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-medium border-none cursor-pointer transition-colors"
              style={{
                background:
                  mode === "scan" ? "var(--bg-surface-light)" : "transparent",
                color:
                  mode === "scan"
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
              }}
            >
              <Camera size={14} />
              {t("badge.scan_with_camera")}
            </button>
          </div>

          {mode === "scan" ? (
            <div className="space-y-3">
              <QrScanner
                onScan={handleScan}
                onError={err => setScanError(err)}
                loadingMessage={t("badge.camera_loading")}
                noCameraMessage={t("badge.camera_not_found")}
              />
              {scanError && (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "#ef4444" }}
                >
                  <AlertCircle size={16} />
                  {scanError}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder={t("badge.verify_placeholder")}
                rows={4}
                className="w-full rounded-lg p-3 text-xs font-mono resize-none outline-none"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--bg-surface-light)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={verify.isPending || !token.trim()}
                className="w-full py-2.5 rounded-full text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-50"
                style={{
                  background: "var(--accent-green)",
                  color: "var(--bg-primary)",
                }}
              >
                {verify.isPending ? t("badge.verifying") : t("badge.verify")}
              </button>
            </form>
          )}

          {verify.error && (
            <div
              className="mt-4 flex items-center gap-2 text-sm"
              style={{ color: "#ef4444" }}
            >
              <AlertCircle size={16} />
              {verify.error.message}
            </div>
          )}

          {verify.data && (
            <div
              className="mt-5 rounded-xl p-4"
              style={{
                background: verify.data.previouslyAttended
                  ? "rgba(245,158,11,0.08)"
                  : "rgba(107,142,90,0.08)",
                border: `1px solid ${
                  verify.data.previouslyAttended
                    ? "rgba(245,158,11,0.2)"
                    : "rgba(107,142,90,0.2)"
                }`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                {verify.data.previouslyAttended ? (
                  <AlertCircle size={18} style={{ color: "#f59e0b" }} />
                ) : (
                  <CheckCircle2
                    size={18}
                    style={{ color: "var(--accent-green)" }}
                  />
                )}
                <span
                  className="text-sm font-medium"
                  style={{
                    color: verify.data.previouslyAttended
                      ? "#f59e0b"
                      : "var(--accent-green)",
                  }}
                >
                  {verify.data.previouslyAttended
                    ? t("badge.already_attended")
                    : t("badge.verified")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--bg-surface)" }}
                >
                  <User size={18} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {verify.data.user?.name || t("badge.unknown_user")}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {verify.data.user?.email}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span className="font-medium">{t("badge.campaign")}:</span>{" "}
                  {campaignTitle || "-"}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span className="font-medium">{t("badge.role_label")}:</span>{" "}
                  {verify.data.role}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
