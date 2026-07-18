import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import { AlertTriangle, RefreshCw, Shield } from "lucide-react";

interface MaintenanceModalProps {
  message?: string | null;
}

export default function MaintenanceModal({ message }: MaintenanceModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--bg-surface-light)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-4"
          style={{ borderBottom: "1px solid var(--bg-surface-light)" }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}
          >
            <AlertTriangle size={22} />
          </div>
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("maintenance.title")}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {message || t("maintenance.default_message")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 px-6 pb-5">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer border-none"
            style={{
              background: "var(--bg-surface-light)",
              color: "var(--text-primary)",
            }}
          >
            <RefreshCw size={14} />
            {t("maintenance.refresh")}
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer border-none"
              style={{ background: "var(--accent-terracotta)", color: "#fff" }}
            >
              <Shield size={14} />
              {t("maintenance.admin_dashboard")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
