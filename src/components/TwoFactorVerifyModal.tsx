import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Shield, KeyRound } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface TwoFactorVerifyModalProps {
  onVerified: () => void;
}

export default function TwoFactorVerifyModal({
  onVerified,
}: TwoFactorVerifyModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verifyTotpMutation = trpc.auth.verifyTwoFactor.useMutation({
    onSuccess: () => {
      toast.success(t("two_factor.success_verified"));
      onVerified();
    },
    onError: err =>
      toast.error(err.message || t("two_factor.error_verify_failed")),
  });

  const verifyBackupMutation = trpc.auth.verifyTwoFactorBackup.useMutation({
    onSuccess: () => {
      toast.success(t("two_factor.success_verified"));
      onVerified();
    },
    onError: err =>
      toast.error(err.message || t("two_factor.error_verify_failed")),
  });

  const handleSubmit = () => {
    if (mode === "totp" && code.length !== 6) return;
    if (mode === "backup" && code.length < 8) return;

    setIsSubmitting(true);
    if (mode === "totp") {
      verifyTotpMutation.mutate(
        { code },
        { onSettled: () => setIsSubmitting(false) }
      );
    } else {
      verifyBackupMutation.mutate(
        { code },
        { onSettled: () => setIsSubmitting(false) }
      );
    }
  };

  const toggleMode = () => {
    setMode(prev => (prev === "totp" ? "backup" : "totp"));
    setCode("");
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-surface-light)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center p-6 pb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{
              background: "rgba(107, 142, 90, 0.15)",
              color: "var(--accent-green)",
            }}
          >
            <Shield size={24} />
          </div>
          <h3
            className="text-lg font-semibold text-center"
            style={{ color: "var(--text-primary)" }}
          >
            {t("two_factor.verify_title")}
          </h3>
          <p
            className="text-sm text-center mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {mode === "totp"
              ? t("two_factor.verify_instruction")
              : t("two_factor.backup_codes_instruction")}
          </p>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {mode === "totp" ? (
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={isSubmitting}
            >
              <InputOTPGroup className="justify-center w-full">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          ) : (
            <div>
              <label
                className="text-xs font-mono uppercase tracking-wider block mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t("two_factor.backup_code")}
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                className="admin-input w-full font-mono"
                disabled={isSubmitting}
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              (mode === "totp" ? code.length !== 6 : code.length < 8) ||
              isSubmitting
            }
            className="w-full px-4 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer border-none disabled:opacity-50"
            style={{
              background: "var(--accent-green)",
              color: "var(--bg-primary)",
            }}
          >
            {isSubmitting ? "..." : t("two_factor.submit")}
          </button>

          <button
            onClick={toggleMode}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none"
            style={{
              background: "var(--bg-surface-light)",
              color: "var(--text-secondary)",
            }}
          >
            <KeyRound size={14} />
            {mode === "totp"
              ? t("two_factor.use_backup_code")
              : t("two_factor.use_totp_code")}
          </button>
        </div>
      </div>
    </div>
  );
}
