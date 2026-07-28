import { useState, useEffect } from "react";
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { toast } from "sonner";
import { useErrorModal } from "@/hooks/useErrorModal";

export function SiteSettingsTab() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { showError } = useErrorModal();
  const { data: settings, isLoading } = trpc.settings.list.useQuery();
  const { data: stats } = trpc.campaign.stats.useQuery();
  const updateMutation = trpc.settings.updateMany.useMutation({
    onSuccess: () => {
      utils.settings.list.invalidate();
      utils.campaign.stats.invalidate();
      toast.success(t("toast.settings_saved"));
    },
    onError: () => showError(t("toast.error_generic")),
  });

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      // Defer to avoid synchronous setState in effect
      const timeout = setTimeout(() => {
        setFormData({ ...settings });
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleToggle = (key: string, defaultValue = "false") => {
    const current = formData[key] ?? settings?.[key] ?? defaultValue;
    const next = current === "true" ? "false" : "true";
    setFormData(prev => ({ ...prev, [key]: next }));
    setHasChanges(true);
  };

  const clearOverride = (key: string) => {
    setFormData(prev => ({ ...prev, [key]: "" }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const changed: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== settings?.[key]) {
        changed[key] = value ?? "";
      }
    }
    updateMutation.mutate(changed);
    setHasChanges(false);
  };

  const textGroups = [
    {
      titleKey: 'admin.settings.section.contact_info',
      keys: ["contact_email", "contact_phone"],
      labelKeys: [
        'admin.settings.label.contact_email',
        'admin.settings.label.contact_phone',
      ],
    },
    {
      titleKey: 'admin.settings.section.social_links',
      keys: ["social_whatsapp", "social_instagram", "social_facebook"],
      labelKeys: [
        'admin.settings.label.social_whatsapp',
        'admin.settings.label.social_instagram',
        'admin.settings.label.social_facebook',
      ],
    },
    {
      titleKey: 'admin.settings.section.donation_en',
      keys: ["donation_title", "donation_description"],
      labelKeys: [
        'admin.settings.label.donation_title',
        'admin.settings.label.donation_description',
      ],
    },
    {
      titleKey: 'admin.settings.section.donation_fr',
      keys: ["donation_title_fr", "donation_description_fr"],
      labelKeys: [
        'admin.settings.label.donation_title_fr',
        'admin.settings.label.donation_description_fr',
      ],
    },
    {
      titleKey: 'admin.settings.section.donation_ar',
      keys: ["donation_title_ar", "donation_description_ar"],
      labelKeys: [
        'admin.settings.label.donation_title_ar',
        'admin.settings.label.donation_description_ar',
      ],
    },
    {
      titleKey: 'admin.settings.section.donation_banking',
      keys: [
        "donation_bank_name",
        "donation_rib",
        "donation_iban",
        "donation_swift",
        "donation_account_holder",
        "donation_paypal",
        "donation_qr_image",
      ],
      labelKeys: [
        'admin.settings.label.donation_bank_name',
        'admin.settings.label.donation_rib',
        'admin.settings.label.donation_iban',
        'admin.settings.label.donation_swift',
        'admin.settings.label.donation_account_holder',
        'admin.settings.label.donation_paypal',
        'admin.settings.label.donation_qr_image',
      ],
    },
    {
      titleKey: 'admin.settings.section.footer_en',
      keys: ["footer_tagline", "footer_copyright"],
      labelKeys: [
        'admin.settings.label.footer_tagline',
        'admin.settings.label.footer_copyright',
      ],
    },
    {
      titleKey: 'admin.settings.section.footer_fr',
      keys: ["footer_tagline_fr", "footer_copyright_fr"],
      labelKeys: [
        'admin.settings.label.footer_tagline_fr',
        'admin.settings.label.footer_copyright_fr',
      ],
    },
    {
      titleKey: 'admin.settings.section.footer_ar',
      keys: ["footer_tagline_ar", "footer_copyright_ar"],
      labelKeys: [
        'admin.settings.label.footer_tagline_ar',
        'admin.settings.label.footer_copyright_ar',
      ],
    },
  ];

  const toggleGroups = [
    {
      titleKey: 'admin.settings.section.social_visibility',
      keys: [
        "social_show_whatsapp",
        "social_show_instagram",
        "social_show_facebook",
      ],
      labelKeys: [
        'admin.settings.label.social_show_whatsapp',
        'admin.settings.label.social_show_instagram',
        'admin.settings.label.social_show_facebook',
      ],
    },
  ];

  // Dashboard stats override fields
  const statOverrides = [
    {
      key: "stat_override_campaigns",
      labelKey: 'admin.settings.stat_campaigns',
      autoValue: stats?.campaigns ?? 0,
      isOverridden: stats?._meta?.campaignsOverridden ?? false,
    },
    {
      key: "stat_override_volunteers",
      labelKey: 'admin.settings.stat_volunteers',
      autoValue: stats?.volunteers ?? 0,
      isOverridden: stats?._meta?.volunteersOverridden ?? false,
    },
    {
      key: "stat_override_neighborhoods",
      labelKey: 'admin.settings.stat_neighborhoods',
      autoValue: stats?.neighborhoods ?? 0,
      isOverridden: stats?._meta?.neighborhoodsOverridden ?? false,
    },
    {
      key: "stat_waste_kg",
      labelKey: 'admin.settings.stat_waste_kg',
      autoValue: null, // always manual
      isOverridden: false,
    },
    {
      key: "stat_trees",
      labelKey: 'admin.settings.stat_trees',
      autoValue: null, // always manual
      isOverridden: false,
    },
  ];

  if (isLoading)
    return (
      <div className="p-8" style={{ color: "var(--text-secondary)" }}>
        {t('admin.settings.loading')}
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t('admin.settings.title')}
        </h2>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            style={{
              background: "var(--accent-green)",
              color: "var(--bg-primary)",
            }}
          >
            {updateMutation.isPending
              ? t('admin.shared.saving')
              : t('admin.settings.save_changes')}
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Dashboard Stats Overrides */}
        <div>
          <h3
            className="text-sm font-mono uppercase tracking-wider mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t('admin.settings.stats_title')}
          </h3>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            {t('admin.settings.stats_description')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statOverrides.map(stat => (
              <div
                key={stat.key}
                className="p-4 rounded-lg"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--bg-surface-light)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t(stat.labelKey)}
                  </label>
                  {stat.autoValue !== null && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {t('admin.settings.auto_prefix').replace("{value}", String(stat.autoValue))}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={
                      stat.autoValue !== null
                        ? t('admin.settings.override_placeholder_auto').replace("{value}", String(stat.autoValue))
                        : t('admin.settings.override_placeholder_manual')
                    }
                    value={formData[stat.key] ?? settings?.[stat.key] ?? ""}
                    onChange={e => handleChange(stat.key, e.target.value)}
                    className="admin-input flex-1"
                  />
                  {(formData[stat.key] ?? settings?.[stat.key] ?? "") !==
                    "" && (
                    <button
                      onClick={() => clearOverride(stat.key)}
                      className="px-3 py-2 rounded text-xs"
                      style={{
                        background: "var(--bg-surface-light)",
                        color: "var(--text-tertiary)",
                      }}
                      title={t('admin.settings.clear_override_title')}
                    >
                      {t('admin.shared.clear')}
                    </button>
                  )}
                </div>
                {stat.isOverridden && (
                  <span
                    className="text-xs mt-1 block"
                    style={{ color: "var(--accent-terracotta)" }}
                  >
                    {t('admin.settings.overridden_note')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Text input groups */}
        {textGroups.map(group => (
          <div key={group.titleKey}>
            <h3
              className="text-sm font-mono uppercase tracking-wider mb-4"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t(group.titleKey)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.keys.map((key, i) => (
                <div key={key}>
                  <label
                    className="text-xs font-mono uppercase tracking-wider block mb-2"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t(group.labelKeys[i])}
                  </label>
                  <input
                    value={formData[key] ?? settings?.[key] ?? ""}
                    onChange={e => handleChange(key, e.target.value)}
                    className="admin-input"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Maintenance Mode */}
        <div>
          <h3
            className="text-sm font-mono uppercase tracking-wider mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t('admin.settings.section.maintenance')}
          </h3>
          <div
            className="flex items-center justify-between p-4 rounded-lg mb-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-surface-light)",
            }}
          >
            <div>
              <span
                className="text-sm font-medium block"
                style={{ color: "var(--text-primary)" }}
              >
                {t('admin.settings.maintenance_enable')}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {t('admin.settings.maintenance_description')}
              </span>
            </div>
            <button
              onClick={() => handleToggle("maintenance_mode")}
              className="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0"
              style={{
                background:
                  (formData["maintenance_mode"] ??
                    settings?.["maintenance_mode"] ??
                    "false") === "true"
                    ? "var(--accent-terracotta)"
                    : "var(--bg-surface-light)",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200"
                style={{
                  background: "var(--bg-primary)",
                  transform:
                    (formData["maintenance_mode"] ??
                      settings?.["maintenance_mode"] ??
                      "false") === "true"
                      ? "translateX(1.5rem)"
                      : "translateX(0)",
                }}
              />
            </button>
          </div>
          <div>
            <label
              className="text-xs font-mono uppercase tracking-wider block mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t('admin.settings.maintenance_message_label')}
            </label>
            <textarea
              value={
                formData["maintenance_message"] ??
                settings?.["maintenance_message"] ??
                ""
              }
              onChange={e =>
                handleChange("maintenance_message", e.target.value)
              }
              placeholder={t('admin.settings.maintenance_placeholder')}
              rows={3}
              className="admin-input"
            />
          </div>
        </div>

        {/* Toggle groups */}
        {toggleGroups.map(group => (
          <div key={group.titleKey}>
            <h3
              className="text-sm font-mono uppercase tracking-wider mb-4"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t(group.titleKey)}
            </h3>
            <div className="space-y-3">
              {group.keys.map((key, i) => {
                const isOn =
                  (formData[key] ?? settings?.[key] ?? "true") === "true";
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--bg-surface-light)",
                    }}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {t(group.labelKeys[i])}
                    </span>
                    <button
                      onClick={() => handleToggle(key, "true")}
                      className="relative w-12 h-6 rounded-full transition-colors duration-200"
                      style={{
                        background: isOn
                          ? "var(--accent-green)"
                          : "var(--bg-surface-light)",
                      }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200"
                        style={{
                          background: "var(--bg-primary)",
                          transform: isOn
                            ? "translateX(1.5rem)"
                            : "translateX(0)",
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
