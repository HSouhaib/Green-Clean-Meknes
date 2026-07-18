import type { Lang } from "@/contexts/language-context";

export const LOGIN_PATH = "/login";

// Navigation links shared across Navigation, Footer, MobileMenu
export const allNavLinks = [
  { key: 'nav.home', href: '#hero', sectionKey: 'hero' },
  { key: 'nav.about', href: '#about', sectionKey: 'about' },
  { key: 'nav.leaderboard', href: '/leaderboard', sectionKey: 'leaderboard', isPage: true },
  { key: 'nav.campaigns', href: '#campaigns', sectionKey: 'campaigns' },
  { key: 'nav.contact', href: '#contact', sectionKey: 'contact' },
] as const;

// Language options shared across Navigation, Footer, MobileMenu
export const langOptions: { code: Lang; label: string; labelKey: string }[] = [
  { code: 'en', label: 'English', labelKey: 'footer.lang.en' },
  { code: 'fr', label: 'Francais', labelKey: 'footer.lang.fr' },
  { code: 'ar', label: 'Arabic', labelKey: 'footer.lang.ar' },
];

// Simple langs array for components that just need the codes
export const langs: Lang[] = ['en', 'fr', 'ar'];

// Shared smooth-scroll handler for nav links
export function handleNavClick(href: string, onDone?: () => void) {
  if (onDone) onDone();
  const el = document.querySelector(href);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}
