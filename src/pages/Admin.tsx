import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import {
  Sun,
  Moon,
  User,
  LogOut,
  Home,
  LayoutDashboard,
  PanelTop,
  Calendar,
  Users,
  Shield,
  Mail,
  Lightbulb,
  Layers,
  Settings,
  MapPin,
  HelpCircle,
  MessageSquare,
  BarChart3,
  UserPlus,
  Menu,
  X,
  Rss,
  Handshake,
  Camera,
} from 'lucide-react';
import {
  VolunteersTab,
  CampaignsTab,
  ContactsTab,
  SectionsTab,
  SiteSettingsTab,
  NeighborhoodsTab,
  FaqsTab,
  TestimonialsTab,
  PollsTab,
  DashboardTab,
  LandingPageTab,
  UsersTab,
  RolesTab,
  PlansTab,
  SocialFeedTab,
  CampaignPhotosTab,
  SponsorsTab,
} from './admin-tabs';

type TabKey = 'dashboard' | 'landing' | 'campaigns' | 'photos' | 'sponsors' | 'socialFeed' | 'users' | 'volunteers' | 'roles' | 'contacts' | 'plans' | 'sections' | 'settings' | 'neighborhoods' | 'faqs' | 'testimonials' | 'polls';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const tabs: TabConfig[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { key: 'landing', label: 'Landing Page', icon: <PanelTop size={16} /> },
  { key: 'campaigns', label: 'Campaigns', icon: <Calendar size={16} /> },
  { key: 'photos', label: 'Photos', icon: <Camera size={16} /> },
  { key: 'sponsors', label: 'Sponsors', icon: <Handshake size={16} /> },
  { key: 'socialFeed', label: 'Social Feed', icon: <Rss size={16} /> },
  { key: 'users', label: 'Users', icon: <Users size={16} /> },
  { key: 'volunteers', label: 'Volunteers', icon: <UserPlus size={16} /> },
  { key: 'roles', label: 'Roles', icon: <Shield size={16} /> },
  { key: 'contacts', label: 'Contacts', icon: <Mail size={16} /> },
  { key: 'plans', label: 'Planning', icon: <Lightbulb size={16} /> },
  { key: 'sections', label: 'Sections', icon: <Layers size={16} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  { key: 'neighborhoods', label: 'Neighborhoods', icon: <MapPin size={16} /> },
  { key: 'faqs', label: 'FAQs', icon: <HelpCircle size={16} /> },
  { key: 'testimonials', label: 'Testimonials', icon: <MessageSquare size={16} /> },
  { key: 'polls', label: 'Polls', icon: <BarChart3 size={16} /> },
];

export default function Admin() {
  const { user, isAuthenticated, isLoading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Notification badge counts
  const { data: unreadContacts } = trpc.contact.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // refetch every 30s
  });
  const { data: pendingVolunteers } = trpc.volunteer.pendingCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: totalRegistrations } = trpc.campaign.registrationTotalCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const badgeMap: Record<string, number | undefined> = {
    contacts: unreadContacts || undefined,
    volunteers: pendingVolunteers || undefined,
    campaigns: totalRegistrations || undefined,
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('admin-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Admin Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--bg-surface-light)',
        }}
      >
        <div className="flex items-center justify-between mx-auto px-4 sm:px-6 py-3" style={{ maxWidth: '1400px' }}>
          {/* Left: Logo + Mobile Menu Button */}
          <div className="flex items-center gap-3 min-w-0">
            <a href="/" className="font-display text-base tracking-tight no-underline flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
              GREEN <span className="font-light hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>Admin</span>
            </a>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden lg:flex gap-1 overflow-x-auto flex-1 mx-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                style={{
                  color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
                }}
              >
                {tab.icon}
                <span className="hidden xl:inline">{tab.label}</span>
                {badgeMap[tab.key] ? (
                  <span
                    className="ml-1 px-1.5 py-0 rounded-full text-[10px] font-bold min-w-[18px] text-center"
                    style={{ background: 'var(--accent-terracotta)', color: 'white' }}
                  >
                    {badgeMap[tab.key]}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Profile Dropdown (click-based for mobile) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                title={user?.name ?? user?.email ?? 'Profile'}
              >
                <User size={18} />
              </button>
              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg overflow-hidden z-50"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-surface-light)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="p-4" style={{ borderBottom: '1px solid var(--bg-surface-light)' }}>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {user?.name ?? 'User'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {user?.email}
                    </div>
                    <span
                      className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        background: 'var(--accent-terracotta)',
                        color: 'white',
                      }}
                    >
                      {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </div>
                  <div className="p-2">
                    <a
                      href="/"
                      onClick={(e) => { e.preventDefault(); navigate('/'); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-[var(--bg-surface-light)] no-underline"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Home size={14} />
                      Back to Site
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full transition-colors"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-colors bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--text-tertiary)' }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: 'var(--bg-surface-light)' }}>
            <div className="mx-auto px-4 py-3 space-y-1" style={{ maxWidth: '1400px' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  style={{
                    color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    background: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {badgeMap[tab.key] ? (
                    <span
                      className="ml-auto px-1.5 py-0 rounded-full text-[10px] font-bold min-w-[18px] text-center"
                      style={{ background: 'var(--accent-terracotta)', color: 'white' }}
                    >
                      {badgeMap[tab.key]}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="mx-auto px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '1400px' }}>
        {activeTab === 'dashboard' && <DashboardTab onNavigate={setActiveTab} />}
        {activeTab === 'landing' && <LandingPageTab />}
        {activeTab === 'campaigns' && <CampaignsTab />}
        {activeTab === 'photos' && <CampaignPhotosTab />}
        {activeTab === 'sponsors' && <SponsorsTab />}
        {activeTab === 'socialFeed' && <SocialFeedTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'volunteers' && <VolunteersTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'plans' && <PlansTab />}
        {activeTab === 'sections' && <SectionsTab />}
        {activeTab === 'settings' && <SiteSettingsTab />}
        {activeTab === 'neighborhoods' && <NeighborhoodsTab />}
        {activeTab === 'faqs' && <FaqsTab />}
        {activeTab === 'testimonials' && <TestimonialsTab />}
        {activeTab === 'polls' && <PollsTab />}
      </div>

      {/* Admin styles */}
      <style>{`
        .admin-input {
          background: var(--bg-primary);
          border: 1px solid var(--bg-surface-light);
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .admin-input:focus {
          border-color: var(--accent-green);
        }
        .admin-input::placeholder {
          color: var(--text-tertiary);
        }
        select.admin-input {
          appearance: auto;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
