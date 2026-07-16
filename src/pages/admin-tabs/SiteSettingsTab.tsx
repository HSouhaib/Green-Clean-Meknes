import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import { toast } from 'sonner';
import { useErrorModal } from '@/hooks/useErrorModal';

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
      toast.success(t('toast.settings_saved'));
    },
    onError: () => showError(t('toast.error_generic')),
  });

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleToggle = (key: string) => {
    const current = formData[key] ?? settings?.[key] ?? 'false';
    const next = current === 'true' ? 'false' : 'true';
    setFormData((prev) => ({ ...prev, [key]: next }));
    setHasChanges(true);
  };

  const clearOverride = (key: string) => {
    setFormData((prev) => ({ ...prev, [key]: '' }));
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
      title: 'Contact Information',
      keys: ['contact_email', 'contact_phone'],
      labels: ['Email Address', 'Phone Number'],
    },
    {
      title: 'Social Links',
      keys: ['social_whatsapp', 'social_instagram', 'social_facebook'],
      labels: ['WhatsApp URL', 'Instagram URL', 'Facebook URL'],
    },
    {
      title: 'Donation Text (English)',
      keys: ['donation_title', 'donation_description'],
      labels: ['Title (EN)', 'Description (EN)'],
    },
    {
      title: 'Donation Text (French)',
      keys: ['donation_title_fr', 'donation_description_fr'],
      labels: ['Title (FR)', 'Description (FR)'],
    },
    {
      title: 'Donation Text (Arabic)',
      keys: ['donation_title_ar', 'donation_description_ar'],
      labels: ['Title (AR)', 'Description (AR)'],
    },
    {
      title: 'Donation Banking',
      keys: ['donation_bank_name', 'donation_rib', 'donation_iban', 'donation_swift', 'donation_account_holder', 'donation_paypal', 'donation_qr_image'],
      labels: ['Bank Name', 'RIB', 'IBAN', 'SWIFT/BIC', 'Account Holder', 'PayPal URL', 'QR Image URL'],
    },
    {
      title: 'Footer Text (English)',
      keys: ['footer_tagline', 'footer_copyright'],
      labels: ['Tagline (EN)', 'Copyright (EN)'],
    },
    {
      title: 'Footer Text (French)',
      keys: ['footer_tagline_fr', 'footer_copyright_fr'],
      labels: ['Tagline (FR)', 'Copyright (FR)'],
    },
    {
      title: 'Footer Text (Arabic)',
      keys: ['footer_tagline_ar', 'footer_copyright_ar'],
      labels: ['Tagline (AR)', 'Copyright (AR)'],
    },
  ];

  const toggleGroups = [
    {
      title: 'Social Visibility',
      keys: ['social_show_whatsapp', 'social_show_instagram', 'social_show_facebook'],
      labels: ['Show WhatsApp', 'Show Instagram', 'Show Facebook'],
    },
  ];

  // Dashboard stats override fields
  const statOverrides = [
    {
      key: 'stat_override_campaigns',
      label: 'Campaigns',
      autoValue: stats?.campaigns ?? 0,
      isOverridden: stats?._meta?.campaignsOverridden ?? false,
    },
    {
      key: 'stat_override_volunteers',
      label: 'Volunteers',
      autoValue: stats?.volunteers ?? 0,
      isOverridden: stats?._meta?.volunteersOverridden ?? false,
    },
    {
      key: 'stat_override_neighborhoods',
      label: 'Neighborhoods',
      autoValue: stats?.neighborhoods ?? 0,
      isOverridden: stats?._meta?.neighborhoodsOverridden ?? false,
    },
    {
      key: 'stat_waste_kg',
      label: 'Waste Collected (kg)',
      autoValue: null, // always manual
      isOverridden: false,
    },
    {
      key: 'stat_trees',
      label: 'Trees Planted',
      autoValue: null, // always manual
      isOverridden: false,
    },
  ];

  if (isLoading) return <div className="p-8" style={{ color: 'var(--text-secondary)' }}>Loading settings...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Site Settings</h2>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Dashboard Stats Overrides */}
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Dashboard Stats (Impact Section)
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Leave override fields empty to use auto-calculated values from per-campaign totals. 
            Enter a number to override the displayed value. These overrides are never overwritten by campaign updates.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statOverrides.map((stat) => (
              <div key={stat.key} className="p-4 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    {stat.label}
                  </label>
                  {stat.autoValue !== null && (
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Auto: {stat.autoValue}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={stat.autoValue !== null ? `Override (auto: ${stat.autoValue})` : 'Enter value'}
                    value={formData[stat.key] ?? settings?.[stat.key] ?? ''}
                    onChange={(e) => handleChange(stat.key, e.target.value)}
                    className="admin-input flex-1"
                  />
                  {(formData[stat.key] ?? settings?.[stat.key] ?? '') !== '' && (
                    <button
                      onClick={() => clearOverride(stat.key)}
                      className="px-3 py-2 rounded text-xs"
                      style={{ background: 'var(--bg-surface-light)', color: 'var(--text-tertiary)' }}
                      title="Clear override, use auto-calculated"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {stat.isOverridden && (
                  <span className="text-xs mt-1 block" style={{ color: 'var(--accent-terracotta)' }}>
                    Overriding auto-calculated value
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Text input groups */}
        {textGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {group.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.keys.map((key, i) => (
                <div key={key}>
                  <label className="text-xs font-mono uppercase tracking-wider block mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    {group.labels[i]}
                  </label>
                  <input
                    value={formData[key] ?? settings?.[key] ?? ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="admin-input"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Toggle groups */}
        {toggleGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {group.title}
            </h3>
            <div className="space-y-3">
              {group.keys.map((key, i) => {
                const isOn = (formData[key] ?? settings?.[key] ?? 'true') === 'true';
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {group.labels[i]}
                    </span>
                    <button
                      onClick={() => handleToggle(key)}
                      className="relative w-12 h-6 rounded-full transition-colors duration-200"
                      style={{
                        background: isOn ? 'var(--accent-green)' : 'var(--bg-surface-light)',
                      }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200"
                        style={{
                          background: 'var(--bg-primary)',
                          transform: isOn ? 'translateX(1.5rem)' : 'translateX(0)',
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
