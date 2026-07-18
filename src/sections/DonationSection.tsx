import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import SectionLabel from '@/components/SectionLabel';

export default function DonationSection() {
  const { lang, t } = useLanguage();
  const { data: settings } = trpc.settings.list.useQuery();

  // Use language-specific settings if available, fall back to translations
  const title = settings?.[`donation_title_${lang}`] ?? settings?.donation_title ?? t('donation.title');
  const description = settings?.[`donation_description_${lang}`] ?? settings?.donation_description ?? t('donation.description');
  const bankName = settings?.donation_bank_name ?? 'Bank of Africa';
  const rib = settings?.donation_rib ?? '007 999 0001234567890123 45';
  const iban = settings?.donation_iban ?? 'MA64 0079 9900 0123 4567 8901 2345';
  const swift = settings?.donation_swift ?? 'BMCEMAMC';
  const accountHolder = settings?.donation_account_holder ?? 'Green Clean Meknes Association';
  const paypal = settings?.donation_paypal ?? '';
  const qrImage = settings?.donation_qr_image ?? '';

  // Get live stats from settings
  const campaigns = settings?.stat_campaigns ?? '40';
  const volunteers = settings?.stat_volunteers ?? '800';
  const neighborhoods = settings?.stat_neighborhoods ?? '12';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t('donation.copied'));
  };

  return (
    <section id="donation" style={{ padding: 'var(--section-gap) 0', background: 'var(--bg-surface)' }}>
      <div className="mx-auto" style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}>
        <div className="text-center mb-12" data-animate="fade-up">
          <SectionLabel text={t('donation.label')} />
          <h2
            className="font-display mt-6 leading-[1.1]"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h2>
          <p
            className="font-light leading-[1.7] mt-6 mx-auto"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '16px',
              maxWidth: '600px',
            }}
          >
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-animate="fade-up" data-stagger="0.1">
          {/* Bank Transfer Details */}
          <div
            className="p-6 rounded-lg"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--bg-surface-light)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--accent-green-light)' }}>
                <path d="M3 21h18M3 10h18M5 10l7-7 7 7M12 3v18" />
              </svg>
              <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{t('donation.bank_transfer')}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {t('donation.bank_name')}
                </label>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{bankName}</p>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {t('donation.account_holder')}
                </label>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{accountHolder}</p>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  RIB
                </label>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 px-3 py-2 rounded text-xs font-mono"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                  >
                    {rib}
                  </code>
                  <button
                    onClick={() => copyToClipboard(rib)}
                    className="px-3 py-2 rounded text-xs font-medium transition-colors"
                    style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                  >
                    {t('donation.copy')}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {t('donation.iban')}
                </label>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 px-3 py-2 rounded text-xs font-mono"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                  >
                    {iban}
                  </code>
                  <button
                    onClick={() => copyToClipboard(iban)}
                    className="px-3 py-2 rounded text-xs font-medium transition-colors"
                    style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                  >
                    {t('donation.copy')}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {t('donation.swift')}
                </label>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 px-3 py-2 rounded text-xs font-mono"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                  >
                    {swift}
                  </code>
                  <button
                    onClick={() => copyToClipboard(swift)}
                    className="px-3 py-2 rounded text-xs font-medium transition-colors"
                    style={{ background: 'var(--accent-green)', color: 'var(--bg-primary)' }}
                  >
                    {t('donation.copy')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: PayPal + QR + Impact */}
          <div className="space-y-6">
            {/* PayPal */}
            {paypal && (
              <div
                className="p-6 rounded-lg"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-surface-light)',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ color: 'var(--accent-terracotta)', fontSize: '20px', fontWeight: 'bold' }}>P</span>
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{t('donation.paypal')}</span>
                </div>
                <a
                  href={paypal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 rounded text-center text-sm font-medium transition-colors"
                  style={{ background: 'var(--accent-terracotta)', color: 'var(--bg-primary)' }}
                >
                  {t('donation.paypal_cta')}
                </a>
              </div>
            )}

            {/* QR Code */}
            {qrImage && (
              <div
                className="p-6 rounded-lg text-center"
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-surface-light)',
                }}
              >
                <span className="font-medium text-sm block mb-4" style={{ color: 'var(--text-primary)' }}>{t('donation.scan_qr')}</span>
                <img src={qrImage} alt="Donation QR Code" className="mx-auto h-40 w-40 object-contain rounded" loading="lazy" />
              </div>
            )}

            {/* Campaign Impact Info - with live stats */}
            <div
              className="p-6 rounded-lg"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-surface-light)',
              }}
            >
              <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                {t('donation.impact_title')}
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-green-light)' }}>◆</span>
                  <span>{t('donation.impact_1').replace('{campaigns}', campaigns)}</span>
                </li>
                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-green-light)' }}>◆</span>
                  <span>{t('donation.impact_2').replace('{volunteers}', volunteers)}</span>
                </li>
                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-green-light)' }}>◆</span>
                  <span>{t('donation.impact_3').replace('{neighborhoods}', neighborhoods)}</span>
                </li>
                <li className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent-green-light)' }}>◆</span>
                  <span>{t('donation.impact_4')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
