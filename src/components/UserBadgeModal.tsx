import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import UserAvatar from '@/components/UserAvatar';
import Logo from '@/components/Logo';
import { X, Printer, BadgeCheck } from 'lucide-react';
import { useRef } from 'react';
import type { RouterOutputs } from '@/lib/trpc';

type User = NonNullable<RouterOutputs['auth']['me']>;

interface UserBadgeModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

function formatMemberSince(date: Date | string | number, lang: string): string {
  const d = date instanceof Date ? date : new Date(date);
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}

function getBadgeId(user: User): string {
  const prefix = 'GCM';
  const year = new Date(user.createdAt).getFullYear();
  const id = String(user.id).padStart(4, '0');
  return `${prefix}-${year}-${id}`;
}

export default function UserBadgeModal({ user, open, onClose }: UserBadgeModalProps) {
  const { t, lang } = useLanguage();
  const { effectiveTheme } = useTheme();
  const badgeRef = useRef<HTMLDivElement>(null);
  const isLight = effectiveTheme === 'light';
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !badgeRef.current) return;

    const badgeHtml = badgeRef.current.outerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${user.name} - Green Clean Meknes Badge</title>
          <style>
            @page { margin: 0; size: auto; }
            body { margin: 0; padding: 40px; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; font-family: Inter, system-ui, sans-serif; }
            .badge-card { box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important; }
          </style>
        </head>
        <body>
          ${badgeHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--bg-surface-light)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="p-6">
          <div className="text-center mb-5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(107,142,90,0.15)' }}
            >
              <BadgeCheck size={24} style={{ color: 'var(--accent-green)' }} />
            </div>
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('user_badge.title')}
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('user_badge.subtitle')}
            </p>
          </div>

          {/* Badge card */}
          <div
            ref={badgeRef}
            className="badge-card rounded-2xl overflow-hidden"
            style={{
              background: isLight ? '#ffffff' : '#111111',
              border: `1px solid ${isLight ? '#e8e8e3' : '#2a2a2a'}`,
            }}
          >
            {/* Top stripe */}
            <div
              className="h-3"
              style={{ background: isAdmin ? 'var(--accent-terracotta)' : 'var(--accent-green)' }}
            />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <Logo size="sm" />
                <span
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: isLight ? '#6a7a5a' : '#8a9a7a' }}
                >
                  {getBadgeId(user)}
                </span>
              </div>

              {/* Avatar + name */}
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-24 h-24 rounded-full p-1 mb-4"
                  style={{
                    background: isAdmin ? 'var(--accent-terracotta)' : 'var(--accent-green)',
                  }}
                >
                  <div
                    className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: isLight ? '#f5f5f0' : '#1a1a1a' }}
                  >
                    <UserAvatar
                      src={user.avatar}
                      name={user.name}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <h3
                  className="text-xl font-semibold"
                  style={{ color: isLight ? '#1a1a1a' : '#f5f5f0' }}
                >
                  {user.name}
                </h3>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: isLight ? '#555555' : '#9e9e9e' }}
                >
                  {user.email}
                </p>

                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: isAdmin
                      ? isLight ? 'rgba(196, 120, 80, 0.12)' : 'rgba(196, 120, 80, 0.2)'
                      : isLight ? 'rgba(107, 142, 90, 0.12)' : 'rgba(107, 142, 90, 0.2)',
                    color: isAdmin ? 'var(--accent-terracotta)' : 'var(--accent-green)',
                  }}
                >
                  {isAdmin ? t('login.role_admin') : t('login.role_volunteer')}
                </span>
              </div>

              {/* Footer details */}
              <div
                className="mt-6 pt-5 flex items-center justify-between text-[11px]"
                style={{
                  borderTop: `1px solid ${isLight ? '#e8e8e3' : '#2a2a2a'}`,
                  color: isLight ? '#777777' : '#888888',
                }}
              >
                <span>{t('user_badge.member_since')} {formatMemberSince(user.createdAt, lang)}</span>
                <span className="font-mono">{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handlePrint}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] border-none cursor-pointer"
            style={{
              background: 'var(--accent-green)',
              color: '#ffffff',
            }}
          >
            <Printer size={16} />
            {t('user_badge.print')}
          </button>
        </div>
      </div>
    </div>
  );
}
