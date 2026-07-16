import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, User, Calendar, MapPin, ChevronRight, Shield, Home } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Profile() {
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading, logout } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: '/login',
  });
  const navigate = useNavigate();

  const { data: myRegistrations } = trpc.campaign.myRegistrations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          height: '64px',
          background: 'rgba(var(--bg-surface-rgb, 30, 30, 30), 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--bg-surface-light)',
        }}
      >
        <div
          className="flex items-center justify-between h-full mx-auto"
          style={{ padding: '0 var(--page-margin)', maxWidth: '1400px' }}
        >
          <a
            href="/"
            className="font-display text-base tracking-tight no-underline"
            style={{ color: 'var(--text-primary)' }}
          >
            GREEN
          </a>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--accent-terracotta)', background: 'var(--bg-surface)' }}
              >
                <Shield size={14} />
                {t('nav.admin')}
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
              title="Back to Home"
            >
              <Home size={16} />
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--text-tertiary)' }}
              title={t('login.logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-16 px-4">
        <div className="mx-auto" style={{ maxWidth: '800px' }}>
          {/* Profile card */}
          <Card
            className="mb-8"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-surface-light)',
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name ?? ''}
                    className="w-16 h-16 rounded-full object-cover"
                    style={{ border: '2px solid var(--bg-surface-light)' }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--bg-surface-light)' }}
                  >
                    <User size={28} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                )}
                <div>
                  <h1
                    className="text-xl font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user.name ?? t('login.account')}
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </p>
                  <span
                    className="inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: user.role === 'admin' || user.role === 'super_admin' ? 'var(--accent-terracotta)' : 'var(--accent-green)',
                      color: 'white',
                    }}
                  >
                    {user.role === 'admin' || user.role === 'super_admin' ? t('login.role_admin') : t('login.role_volunteer')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Campaigns */}
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('profile.my_campaigns')}
          </h2>

          {myRegistrations && myRegistrations.filter(r => r.campaign).length > 0 ? (
            <div className="space-y-3">
              {myRegistrations.filter(r => r.campaign).map((reg) => (
                <Card
                  key={reg.id}
                  className="transition-all duration-200 hover:shadow-lg active:scale-[0.99]"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-surface-light)',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/#campaigns')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm font-medium truncate md:text-base"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {reg.campaign?.titleEn ?? 'Unknown Campaign'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <Calendar size={12} />
                            {reg.campaign?.date}
                          </span>
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <MapPin size={12} />
                            {reg.campaign?.locationEn}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-surface-light)',
              }}
            >
              <CardContent className="p-8 text-center">
                <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('profile.no_campaigns')}
                </p>
                <button
                  onClick={() => navigate('/#campaigns')}
                  className="mt-4 text-sm font-medium transition-colors duration-200 hover:text-[var(--accent-green-light)] bg-transparent border-none cursor-pointer"
                  style={{ color: 'var(--accent-green)' }}
                >
                  {t('profile.browse_campaigns')}
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
