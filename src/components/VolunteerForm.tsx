import React, { useState } from "react";
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from "sonner";
import { useErrorModal } from "@/hooks/useErrorModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface VolunteerFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export default function VolunteerForm({
  onSuccess,
  compact = false,
}: VolunteerFormProps) {
  const { t } = useLanguage();
  const { showError } = useErrorModal();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const submitMutation = trpc.volunteer.submit.useMutation({
    onSuccess: data => {
      if (data.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", phone: "", message: "" });
        toast.success(t("volunteer.success"));
        onSuccess?.();
      } else {
        showError(data.message || t("toast.error_generic"));
      }
    },
    onError: err => showError(err.message || t("toast.error_generic")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    submitMutation.mutate(formData);
  };

  const inputBaseStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--bg-surface)",
    border: "1.5px solid var(--bg-surface-light)",
    borderRadius: "12px",
    padding: "14px 16px 14px 48px",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    transition: "all 0.25s ease",
  };

  const inputFocusStyle: React.CSSProperties = {
    borderColor: "var(--accent-green)",
    boxShadow: "0 0 0 3px rgba(107, 142, 90, 0.12)",
  };

  const getInputStyle = (field: string): React.CSSProperties => ({
    ...inputBaseStyle,
    ...(focusedField === field ? inputFocusStyle : {}),
  });

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 py-10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(107, 142, 90, 0.15)" }}
          >
            <CheckCircle2 size={32} style={{ color: "var(--accent-green)" }} />
          </div>
        </motion.div>
        <div>
          <p
            className="text-base font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {t("volunteer.success")}
          </p>
          <p
            className="text-sm mt-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {t("volunteer.success_subtitle")}
          </p>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer border-none hover:opacity-90"
          style={{
            background: "var(--bg-surface-light)",
            color: "var(--text-secondary)",
          }}
        >
          <ArrowRight size={14} />
          {t("volunteer.register_another")}
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "space-y-3" : "space-y-4"}
    >
      <AnimatePresence>
        {/* Name */}
        <motion.div
          key="name-field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="relative"
        >
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
            placeholder={t("volunteer.name")}
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
            required
            style={getInputStyle("name")}
          />
        </motion.div>

        {/* Email */}
        <motion.div
          key="email-field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative"
        >
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
            placeholder={t("volunteer.email")}
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            required
            style={getInputStyle("email")}
          />
        </motion.div>

        {/* Phone */}
        <motion.div
          key="phone-field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Phone
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              color:
                focusedField === "phone"
                  ? "var(--accent-green)"
                  : "var(--text-tertiary)",
              transition: "color 0.25s",
            }}
          />
          <input
            type="tel"
            placeholder={t("volunteer.phone")}
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
            style={getInputStyle("phone")}
          />
        </motion.div>

        {/* Message */}
        <motion.div
          key="message-field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative"
        >
          <MessageSquare
            size={16}
            className="absolute left-4 top-4 pointer-events-none"
            style={{
              color:
                focusedField === "message"
                  ? "var(--accent-green)"
                  : "var(--text-tertiary)",
              transition: "color 0.25s",
            }}
          />
          <textarea
            placeholder={t("volunteer.message")}
            value={formData.message}
            onChange={e =>
              setFormData({ ...formData, message: e.target.value })
            }
            onFocus={() => setFocusedField("message")}
            onBlur={() => setFocusedField(null)}
            rows={compact ? 2 : 3}
            style={{
              ...getInputStyle("message"),
              paddingTop: "14px",
              resize: "vertical",
              minHeight: compact ? "60px" : "80px",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        type="submit"
        disabled={submitMutation.isPending}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer border-none relative overflow-hidden"
        style={{
          background: "var(--accent-green)",
          color: "white",
          padding: compact ? "12px 20px" : "14px 24px",
          opacity: submitMutation.isPending ? 0.7 : 1,
        }}
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t("volunteer.submitting")}
          </>
        ) : (
          <>
            <Send size={15} />
            {t("volunteer.submit")}
          </>
        )}
      </motion.button>

      <p
        className="text-center text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        {t("volunteer.no_account_note")}
      </p>
    </form>
  );
}
