import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import BadgeVerifyModal from "@/components/BadgeVerifyModal";
import { Search, ScanLine, Users, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export function PresenceTab() {
  const { t } = useLanguage();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);

  const { data: campaigns } = trpc.campaign.listAll.useQuery();
  const { data: registrations, refetch } =
    trpc.campaign.registrationsByCampaign.useQuery(
      { id: selectedCampaignId! },
      { enabled: selectedCampaignId !== null }
    );

  const markAttendance = trpc.badge.markAttendance.useMutation({
    onSuccess: () => {
      refetch();
      toast.success(t("badge.attendance_updated"));
    },
    onError: () => toast.error(t("badge.attendance_update_failed")),
  });

  const selectedCampaign = campaigns?.find(c => c.id === selectedCampaignId);

  const filtered = (registrations || [])
    .filter(reg => {
      const term = search.toLowerCase();
      const name = (reg.user?.name || reg.guestName || "").toLowerCase();
      const email = (reg.user?.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    })
    .sort((a, b) => Number(b.attended) - Number(a.attended));

  const total = filtered.length;
  const attendedCount = filtered.filter(r => r.attended).length;

  const handleToggle = (regId: number, attended: boolean) => {
    markAttendance.mutate({ registrationId: regId, attended });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2
          className="text-xl font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t("badge.presence_title")}
        </h2>
        <button
          onClick={() => setVerifyOpen(true)}
          disabled={!selectedCampaignId}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-none cursor-pointer transition-colors disabled:opacity-50"
          style={{
            background: "var(--accent-green)",
            color: "var(--bg-primary)",
          }}
        >
          <ScanLine size={16} />
          {t("badge.scan_badge")}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedCampaignId ?? ""}
          onChange={e =>
            setSelectedCampaignId(
              e.target.value ? Number(e.target.value) : null
            )
          }
          className="admin-input"
        >
          <option value="">{t("badge.select_campaign")}</option>
          {(campaigns || []).map(c => (
            <option key={c.id} value={c.id}>
              {c.titleEn}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("badge.search_placeholder")}
            className="admin-input pl-9"
          />
        </div>
      </div>

      {selectedCampaign && (
        <div
          className="flex flex-wrap items-center gap-4 rounded-xl p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-surface-light)",
          }}
        >
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("badge.registered")}: <strong>{total}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} style={{ color: "var(--accent-green)" }} />
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("badge.attended")}: <strong>{attendedCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle size={16} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("badge.not_attended")}:{" "}
              <strong>{total - attendedCount}</strong>
            </span>
          </div>
        </div>
      )}

      {selectedCampaignId ? (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-surface-light)",
          }}
        >
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p style={{ color: "var(--text-secondary)" }}>
                {t("badge.no_registrations")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--bg-surface-light)",
                    }}
                  >
                    <th
                      className="py-3 px-4 font-mono text-xs uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("badge.volunteer")}
                    </th>
                    <th
                      className="py-3 px-4 font-mono text-xs uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("badge.role_label")}
                    </th>
                    <th
                      className="py-3 px-4 font-mono text-xs uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("badge.status")}
                    </th>
                    <th
                      className="py-3 px-4 font-mono text-xs uppercase tracking-wider text-right"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("badge.present")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(reg => (
                    <tr
                      key={reg.id}
                      className="transition-colors hover:bg-[var(--bg-surface-light)]"
                      style={{
                        borderBottom: "1px solid var(--bg-surface-light)",
                      }}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {reg.user?.name || reg.guestName || "-"}
                          </p>
                          {reg.user?.email && (
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {reg.user.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td
                        className="py-3 px-4 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {reg.user?.role || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            background: reg.attended
                              ? "rgba(107,142,90,0.15)"
                              : "rgba(255,255,255,0.06)",
                            color: reg.attended
                              ? "var(--accent-green)"
                              : "var(--text-tertiary)",
                          }}
                        >
                          {reg.attended
                            ? t("badge.attended")
                            : t("badge.not_attended")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggle(reg.id, !reg.attended)}
                          disabled={markAttendance.isPending}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer transition-colors disabled:opacity-50"
                          style={{
                            background: reg.attended
                              ? "rgba(239,68,68,0.1)"
                              : "rgba(107,142,90,0.15)",
                            color: reg.attended
                              ? "#ef4444"
                              : "var(--accent-green)",
                          }}
                        >
                          {reg.attended
                            ? t("badge.mark_absent")
                            : t("badge.mark_present")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-surface-light)",
          }}
        >
          <p style={{ color: "var(--text-secondary)" }}>
            {t("badge.select_campaign_prompt")}
          </p>
        </div>
      )}

      <BadgeVerifyModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={() => refetch()}
      />
    </div>
  );
}
