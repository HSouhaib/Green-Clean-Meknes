import { useState, useEffect } from "react";
import { useLanguage } from '@/hooks/useLanguage';
import MobileMenu from "./MobileMenu";
import Logo from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";
import LoginModal from "@/components/LoginModal";
import { useLoginModalTrigger } from "@/hooks/useLoginModal";
import { useSectionVisibility } from "@/hooks/useSectionVisibility";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { allNavLinks, handleNavClick } from "@/const";
import { User, LogOut } from "lucide-react";

export default function Navigation() {
  const { t, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isOpen: loginModalOpen, setIsOpen: setLoginModalOpen } =
    useLoginModalTrigger();
  const { isVisible } = useSectionVisibility();
  const { user, isAuthenticated, logout } = useAuth();

  const { isLight, isAuto, cycle } = useTheme();

  const navLinks = allNavLinks.filter(link => isVisible(link.sectionKey));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onNavClick = (href: string) => {
    setMobileOpen(false);
    handleNavClick(href);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: "64px",
          background: scrolled
            ? isLight
              ? "rgba(245,245,240,0.9)"
              : "rgba(10,10,10,0.85)"
            : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div
          className="flex items-center justify-between h-full mx-auto"
          style={{ padding: "0 var(--page-margin)", maxWidth: "1400px" }}
        >
          {/* Logo */}
          <a
            href="#hero"
            onClick={e => {
              e.preventDefault();
              onNavClick("#hero");
            }}
            className="no-underline"
          >
            <Logo />
          </a>

          {/* Desktop nav links */}
          <div
            className={`hidden md:flex items-center gap-8 ${isRtl ? "flex-row-reverse" : ""}`}
          >
            {navLinks.map(link => (
              <a
                key={link.key}
                href={link.href}
                onClick={e => {
                  e.preventDefault();
                  onNavClick(link.href);
                }}
                className="relative text-sm font-normal no-underline transition-colors duration-200 hover:text-[var(--accent-green-light)]"
                style={{
                  color: "var(--text-secondary)",
                  letterSpacing: "0.04em",
                }}
              >
                {t(link.key)}
              </a>
            ))}
            {/* Login / User */}
            {isAuthenticated ? (
              <>
                <a
                  href="/profile"
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 hover:bg-[var(--bg-surface-light)]"
                  style={{ color: "var(--text-secondary)" }}
                  title={t("nav.account")}
                >
                  <User size={18} />
                </a>
                <button
                  onClick={logout}
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 hover:bg-[var(--bg-surface-light)] bg-transparent border-none cursor-pointer"
                  style={{ color: "var(--text-tertiary)" }}
                  title={t("login.logout")}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="relative text-sm font-normal no-underline transition-colors duration-200 hover:text-[var(--accent-green-light)] bg-transparent border-none cursor-pointer"
                style={{
                  color: "var(--accent-green-light)",
                  letterSpacing: "0.04em",
                }}
              >
                {t("nav.login")}
              </button>
            )}
          </div>

          {/* Right side */}
          <div
            className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}
          >
            {/* Language switcher - desktop */}
            <LanguageSwitcher className="hidden md:flex" />

            {/* Theme toggle - cycles dark -> light -> auto */}
            <button
              onClick={cycle}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-transparent border-none cursor-pointer transition-colors"
              style={{ color: "var(--text-secondary)" }}
              aria-label={
                isAuto
                  ? "Auto (Meknes time)"
                  : isLight
                    ? "Switch to dark mode"
                    : "Switch to light mode"
              }
              title={
                isAuto
                  ? "Auto (follows Meknes day/night)"
                  : isLight
                    ? "Switch to dark mode"
                    : "Switch to light mode"
              }
            >
              {isAuto ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <circle
                    cx="12"
                    cy="10"
                    r="2"
                    fill="currentColor"
                    stroke="none"
                  />
                  <path d="M12 6v1" strokeWidth="1.5" />
                  <path d="M12 13v1" strokeWidth="1.5" />
                  <path d="M8 10H7" strokeWidth="1.5" />
                  <path d="M17 10h-1" strokeWidth="1.5" />
                </svg>
              ) : isLight ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex flex-col gap-1 p-2 bg-transparent border-none cursor-pointer"
              aria-label="Open menu"
            >
              <span
                className="block w-5"
                style={{ height: "2px", background: "var(--text-primary)" }}
              />
              <span
                className="block w-5"
                style={{ height: "2px", background: "var(--text-primary)" }}
              />
              <span
                className="block w-5"
                style={{ height: "2px", background: "var(--text-primary)" }}
              />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        navLinks={navLinks}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogout={logout}
      />
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
}
