import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Shield, Copy, Check, X } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface TwoFactorSetupModalProps {
  open: boolean;
  onClose: () => void;
  onEnabled: () => void;
}

export default function TwoFactorSetupModal({
  open,
  onClose,
  onEnabled,
}: TwoFactorSetupModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"setup" | "codes">("setup");
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setupMutation = trpc.auth.setupTwoFactor.useMutation({
    onSuccess: data => {
      setSecret(data.secret);
      setQrDataUrl(data.qrDataUrl);
    },
    onError: () => toast.error(t("two_factor.error_setup_failed")),
  });

  const enableMutation = trpc.auth.enableTwoFactor.useMutation({
    onSuccess: data => {
      setBackupCodes(data.backupCodes);
      setStep("codes");
      toast.success(t("two_factor.success_enabled"));
    },
    onError: () => toast.error(t("two_factor.error_invalid_code")),
  });

  const handleOpen = () => {
    setStep("setup");
    setSecret("");
    setQrDataUrl("");
    setCode("");
    setBackupCodes([]);
    setupMutation.mutate();
  };

  const handleEnable = () => {
    if (code.length !== 6) return;
    setIsSubmitting(true);
    enableMutation.mutate(
      { secret, code },
      {
        onSettled: () => setIsSubmitting(false),
      }
    );
  };

  const handleClose = () => {
    if (step === "codes") {
      onEnabled();
    }
    onClose();
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  if (!open) {
    // Reset state when modal is closed so it re-fetches next time
    if (secret || qrDataUrl || backupCodes.length > 0) {
      setSecret("");
      setQrDataUrl("");
      setCode("");
      setBackupCodes([]);
    }
    return null;
  }

  // Lazy initialize when first opened
  if (
    !secret &&
    !qrDataUrl &&
    step === "setup" &&
    setupMutation.status === "idle"
  ) {
    handleOpen();
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-surface-light)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: "1px solid var(--bg-surface-light)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(107, 142, 90, 0.15)",
                color: "var(--accent-green)",
              }}
            >
              <Shield size={18} />
            </div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {step === "setup"
                ? t("two_factor.setup_title")
                : t("two_factor.backup_codes_title")}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer border-none"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === "setup" ? (
            <>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("two_factor.setup_instruction")}
              </p>

              {qrDataUrl && (
                <div className="flex justify-center">
                  <img
                    src={qrDataUrl}
                    alt="QR code"
                    className="rounded-lg"
                    style={{ width: 200, height: 200, background: "#fff" }}
                  />
                </div>
              )}

              {secret && (
                <div
                  className="p-3 rounded-lg"
                  style={{ background: "var(--bg-primary)" }}
                >
                  <p
                    className="text-xs mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t("two_factor.secret_fallback")}
                  </p>
                  <div className="flex items-center gap-2">
                    <code
                      className="flex-1 text-xs p-2 rounded font-mono break-all"
                      style={{
                        background: "var(--bg-surface-light)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="p-2 rounded-lg transition-colors cursor-pointer border-none"
                      style={{
                        background: "var(--bg-surface-light)",
                        color: "var(--text-secondary)",
                      }}
                      title="Copy secret"
                    >
                      {copied ? (
                        <Check
                          size={16}
                          style={{ color: "var(--accent-green)" }}
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label
                  className="text-xs font-mono uppercase tracking-wider block mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {t("two_factor.verification_code")}
                </label>
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={setCode}
                  disabled={isSubmitting}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none"
                  style={{
                    background: "var(--bg-surface-light)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {t("two_factor.cancel")}
                </button>
                <button
                  onClick={handleEnable}
                  disabled={code.length !== 6 || isSubmitting}
                  className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none disabled:opacity-50"
                  style={{
                    background: "var(--accent-green)",
                    color: "var(--bg-primary)",
                  }}
                >
                  {isSubmitting ? "..." : t("two_factor.enable_button")}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("two_factor.backup_codes_instruction")}
              </p>

              <div
                className="p-4 rounded-lg"
                style={{ background: "var(--bg-primary)" }}
              >
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {backupCodes.map(code => (
                    <code
                      key={code}
                      className="text-xs p-2 rounded font-mono text-center"
                      style={{
                        background: "var(--bg-surface-light)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <button
                  onClick={copyBackupCodes}
                  className="w-full px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
                  style={{
                    background: "var(--bg-surface-light)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Copy size={14} />
                  Copy all codes
                </button>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none"
                style={{
                  background: "var(--accent-green)",
                  color: "var(--bg-primary)",
                }}
              >
                {t("two_factor.close")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
