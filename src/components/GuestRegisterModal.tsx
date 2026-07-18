import React, { useState } from "react";
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from "sonner";
import { useErrorModal } from "@/hooks/useErrorModal";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, CheckCircle2, Loader2, Send, Leaf } from "lucide-react";

interface GuestRegisterModalProps {
  campaignId: number;
  campaignTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function GuestRegisterModal({
  campaignId,
  campaignTitle,
  open,
  onClose,
}: GuestRegisterModalProps) {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const registerMutation = trpc.campaign.registerGuest.useMutation({
    onSuccess: data => {
      if (data.success) {
        setSubmitted(true);
        toast.success(data.message || t("guest_register.toast_success"));
        // Invalidate queries to update UI without reload
        utils.campaign.registrationCount.invalidate({ id: campaignId });
        utils.campaign.registrationTotalCount.invalidate();
      } else {
        showError(data.message || t("toast.error_generic"));
      }
    },
    onError: err => showError(err.message || t("toast.error_generic")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    registerMutation.mutate({ id: campaignId, name, email });
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setSubmitted(false);
    setFocusedField(null);
    onClose();
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    background: "var(--bg-surface)",
    border:
      focusedField === field
        ? "1.5px solid var(--accent-green)"
        : "1.5px solid var(--bg-surface-light)",
    borderRadius: "12px",
    padding: "14px 16px 14px 48px",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    transition: "all 0.25s ease",
    boxShadow:
      focusedField === field ? "0 0 0 3px rgba(107, 142, 90, 0.12)" : "none",
  });

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--bg-surface-light)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--bg-surface-light)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(107, 142, 90, 0.15)" }}
              >
                <Leaf size={16} style={{ color: "var(--accent-green)" }} />
              </div>
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {submitted
                    ? t("guest_register.success_title")
                    : t("guest_register.title")}
                </h3>
                {!submitted && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {campaignTitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg transition-colors cursor-pointer border-none"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(107, 142, 90, 0.15)" }}
                >
                  <CheckCircle2
                    size={28}
                    style={{ color: "var(--accent-green)" }}
                  />
                </motion.div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t("guest_register.success_message")}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t("guest_register.success_detail").replace(
                      "{email}",
                      email
                    )}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="px-5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer border-none"
                  style={{ background: "var(--accent-green)", color: "white" }}
                >
                  {t("guest_register.done")}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("guest_register.description")}
                </p>

                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      color:
                        focusedField === "name"
                          ? "var(--accent-green)"
                          : "var(--text-tertiary)",
                      transition: "color 0.25s",
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t("guest_register.name_placeholder")}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle("name")}
                  />
                </div>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                      color:
                        focusedField === "email"
                          ? "var(--accent-green)"
                          : "var(--text-tertiary)",
                      transition: "color 0.25s",
                    }}
                  />
                  <input
                    type="email"
                    placeholder={t("guest_register.email_placeholder")}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle("email")}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={registerMutation.isPending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border-none"
                  style={{
                    background: "var(--accent-green)",
                    color: "white",
                    padding: "14px 24px",
                    opacity: registerMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t("guest_register.registering")}
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      {t("guest_register.submit")}
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
