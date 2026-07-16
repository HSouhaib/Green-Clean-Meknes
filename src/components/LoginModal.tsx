import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/providers/trpc';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Google icon SVG
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57a10.7 10.7 0 0 0 3.27-8.1z" fill="#4285F4"/>
      <path d="M12 23a11.5 11.5 0 0 0 7.94-2.9l-3.57-2.77a7.27 7.27 0 0 1-10.87-3.82H4.34v2.86A12 12 0 0 0 12 23z" fill="#34A853"/>
      <path d="M5.5 13.66a7.18 7.18 0 0 1 0-4.58V6.22H4.34a12 12 0 0 0 0 11.56l3.16-2.45z" fill="#FBBC05"/>
      <path d="M12 4.75a6.5 6.5 0 0 1 4.6 1.8l3.44-3.44A11.48 11.48 0 0 0 12 1a12 12 0 0 0-10.66 6.22l3.16 2.45a7.18 7.18 0 0 1 7.5-5.92z" fill="#EA4335"/>
    </svg>
  );
}

// Shared login panel content (used by both modal and standalone page)
export function LoginPanel() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: providers } = trpc.auth.providers.useQuery();
  const devLoginMutation = trpc.auth.devLogin.useMutation({
    onSuccess: () => {
      window.location.href = '/';
    },
    onError: (err) => {
      setError(err.message);
      setIsLoading(null);
    },
  });

  const devLoginUserMutation = trpc.auth.devLoginUser.useMutation({
    onSuccess: () => {
      window.location.href = '/';
    },
    onError: (err) => {
      setError(err.message);
      setIsLoading(null);
    },
  });

  const handleGoogleLogin = () => {
    setError(null);
    setIsLoading('google');
    window.location.href = '/api/oauth/google';
  };

  const handleDevLogin = () => {
    setError(null);
    setIsLoading('dev');
    devLoginMutation.mutate();
  };

  const handleDevLoginUser = () => {
    setError(null);
    setIsLoading('devuser');
    devLoginUserMutation.mutate();
  };

  // Check if we're in development (devLogin is available)
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // Check if Google is configured
  const isGoogleConfigured = providers?.find((p) => p.key === 'google')?.enabled ?? false;

  return (
    <div className="flex flex-col gap-3">
      {/* Error message */}
      {error && (
        <div className="text-center text-xs p-2 rounded" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading !== null || !isGoogleConfigured}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--bg-surface-light)',
          borderColor: 'var(--bg-surface-light)',
          color: 'var(--text-primary)',
        }}
      >
        {isLoading === 'google' ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <GoogleIcon />
        )}
        <span className="text-sm font-medium">{t('login.provider.google')}</span>
      </button>

      {/* Dev login — only on localhost */}
      {isDev && (
        <>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed" style={{ borderColor: 'var(--bg-surface-light)' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 font-mono" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>
                DEV
              </span>
            </div>
          </div>
          <button
            onClick={handleDevLogin}
            disabled={isLoading !== null}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--accent-terracotta)',
              borderColor: 'var(--accent-terracotta)',
              color: 'white',
            }}
          >
            {isLoading === 'dev' ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span className="text-lg">🛠️</span>
            )}
            <span className="text-sm font-medium">Dev Login (Admin)</span>
          </button>
          <button
            onClick={handleDevLoginUser}
            disabled={isLoading !== null}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--accent-green)',
              borderColor: 'var(--accent-green)',
              color: 'white',
            }}
          >
            {isLoading === 'devuser' ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span className="text-lg">👤</span>
            )}
            <span className="text-sm font-medium">Dev Login (Volunteer)</span>
          </button>
        </>
      )}

      <p className="text-center text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
        {t('login.terms')}
      </p>
    </div>
  );
}

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-surface-light)' }}>
        <DialogHeader>
          <DialogTitle className="text-center font-display" style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}>
            {t('login.title')}
          </DialogTitle>
        </DialogHeader>
        <LoginPanel />
      </DialogContent>
    </Dialog>
  );
}
