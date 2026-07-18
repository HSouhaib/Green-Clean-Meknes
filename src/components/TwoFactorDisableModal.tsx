import { useState } from "react";
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from "sonner";
import { Shield, X } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface TwoFactorDisableModalProps {
  open: boolean;
  onClose: () => void;
  onDisabled: () => void;
}

export default function TwoFactorDisableModal({
  open,
  onClose,
  onDisabled,
}: TwoFactorDisableModalProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disableMutation = trpc.auth.disableTwoFactor.useMutation({
    onSuccess: () => {
      toast.success(t("two_factor.success_disabled"));
      onDisabled();
      onClose();
    },
    onError: err =>
      toast.error(err.message || t("two_factor.error_disable_failed")),
  });

  const handleDisable = () => {
    if (code.length !== 6) return;
    setIsSubmitting(true);
    disableMutation.mutate(
      { code },
      { onSettled: () => setIsSubmitting(false) }
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-surface-light)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: "1px solid var(--bg-surface-light)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
            >
              <Shield size={18} />
            </div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("two_factor.disable_button")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer border-none"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Enter the 6-digit code from your authenticator app to disable
            two-factor authentication.
          </p>

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

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none"
              style={{
                background: "var(--bg-surface-light)",
                color: "var(--text-secondary)",
              }}
            >
              {t("two_factor.cancel")}
            </button>
            <button
              onClick={handleDisable}
              disabled={code.length !== 6 || isSubmitting}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer border-none disabled:opacity-50"
              style={{ background: "#ef4444", color: "#fff" }}
            >
              {isSubmitting ? "..." : t("two_factor.disable_button")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
