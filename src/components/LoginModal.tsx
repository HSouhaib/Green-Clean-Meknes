import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trpc } from '@/lib/trpc';
import { Leaf } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AuthMode = 'signin' | 'signup';

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
  const [mode, setMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: providers } = trpc.auth.providers.useQuery();
  const isGoogleConfigured = providers?.find((p) => p.key === 'google')?.enabled ?? false;
  const isSignIn = mode === 'signin';

  const handleGoogleLogin = () => {
    setError(null);
    setIsLoading(true);
    window.location.href = '/api/oauth/google';
  };

  return (
    <div className="flex flex-col">
      {/* Brand icon */}
      <div className="flex justify-center mb-5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--accent-green)',
            color: 'var(--bg-primary)',
          }}
        >
          <Leaf size={24} />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h2
          className="font-display"
          style={{
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          {isSignIn ? t('login.sign_in_title') : t('login.sign_up_title')}
        </h2>
        <p
          className="text-sm font-light mt-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isSignIn ? t('login.sign_in_subtitle') : t('login.sign_up_subtitle')}
        </p>
      </div>

      {/* Tab switcher */}
      <div
        className="flex rounded-lg p-1 mb-6"
        style={{ background: 'var(--bg-primary)' }}
      >
        <button
          type="button"
          onClick={() => setMode('signin')}
          className="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200"
          style={{
            background: isSignIn ? 'var(--accent-green)' : 'transparent',
            color: isSignIn ? 'var(--bg-primary)' : 'var(--text-secondary)',
          }}
        >
          {t('login.sign_in')}
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className="flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200"
          style={{
            background: !isSignIn ? 'var(--accent-green)' : 'transparent',
            color: !isSignIn ? 'var(--bg-primary)' : 'var(--text-secondary)',
          }}
        >
          {t('login.sign_up')}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="text-center text-xs p-2.5 rounded-lg mb-4"
          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
        >
          {error}
        </div>
      )}

      {!isGoogleConfigured && (
        <div
          className="text-center text-xs p-3 rounded-lg mb-4"
          style={{ background: 'var(--bg-surface-light)', color: 'var(--text-secondary)' }}
        >
          {t('login.oauth_not_configured')}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={isLoading || !isGoogleConfigured}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--bg-surface-light)',
          borderColor: 'var(--bg-surface-light)',
          color: 'var(--text-primary)',
        }}
      >
        {isLoading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <GoogleIcon />
        )}
        <span className="text-sm font-medium">
          {isSignIn ? t('login.provider.google') : t('login.provider.google_signup')}
        </span>
      </button>

      <p
        className="text-center text-xs mt-5"
        style={{ color: 'var(--text-tertiary)' }}
      >
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
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-surface-light)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">
            Authentication
          </DialogTitle>
        </DialogHeader>
        <LoginPanel />
      </DialogContent>
    </Dialog>
  );
}
