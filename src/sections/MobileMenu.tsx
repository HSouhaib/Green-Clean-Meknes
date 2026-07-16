import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/hooks/useTheme";
import { langOptions } from "@/const";
import { useEffect, type CSSProperties } from "react";
import Logo from "@/components/Logo";
import {
  User,
  LogOut,
  LogIn,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  user?: { name?: string | null; email?: string | null } | null;
  navLinks: { key: string; href: string }[];
  onLoginClick?: () => void;
  onLogout?: () => void;
  logoutPending?: boolean;
}

const HAIRLINE = "1px solid rgba(128, 128, 128, 0.15)";

export default function MobileMenu({
  isOpen,
  onClose,
  isAuthenticated,
  navLinks,
  onLoginClick,
  onLogout,
  logoutPending,
}: MobileMenuProps) {
  const { lang, setLang, t, dir } = useLanguage();
  const { isLight, isAuto, cycle } = useTheme();
  const isRtl = dir === "rtl";
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleNavClick = (href: string) => {
    onClose();
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 400);
  };

  // Staggered entrance for menu items, replayed on every open
  const itemStyle = (i: number): CSSProperties => ({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "translateY(0)" : "translateY(14px)",
    transition:
      "opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    transitionDelay: isOpen ? `${150 + i * 55}ms` : "0ms",
  });

  const chevronClass = `shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100 ${
    isRtl
      ? "translate-x-1 group-hover:translate-x-0"
      : "-translate-x-1 group-hover:translate-x-0"
  }`;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: "var(--bg-primary)",
        backgroundImage:
          "radial-gradient(ellipse 90% 45% at 50% -5%, rgba(107, 143, 78, 0.14), transparent)",
        transform: isOpen
          ? "translateX(0)"
          : isRtl
            ? "translateX(-100%)"
            : "translateX(100%)",
        transition:
          "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear 0.45s",
        transitionDelay: isOpen ? "0s, 0s" : "0s, 0.45s",
        visibility: isOpen ? "visible" : "hidden",
        pointerEvents: isOpen ? "auto" : "none",
      }}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between shrink-0"
        style={{ padding: "0.9rem var(--page-margin)" }}
      >
        <a
          href="#hero"
          onClick={e => {
            e.preventDefault();
            handleNavClick("#hero");
          }}
          className="no-underline"
          aria-label="Home"
        >
          <Logo />
        </a>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 rounded-full border-none cursor-pointer transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-light)]"
          style={{ border: "1px solid rgba(128, 128, 128, 0.25)" }}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </header>

      {/* Nav links */}
      <nav
        className="flex-1 flex flex-col justify-center overflow-y-auto"
        style={{ padding: "0 var(--page-margin)" }}
      >
        <div className="w-full" style={{ maxWidth: "480px" }}>
          {navLinks.map((link, i) => (
            <a
              key={link.key}
              href={link.href}
              onClick={e => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className="group flex items-center gap-4 no-underline"
              style={{
                ...itemStyle(i),
                padding: "0.85rem 0",
                borderBottom: HAIRLINE,
              }}
            >
              <span
                className="font-mono text-xs"
                style={{ color: "var(--accent-green-light)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="flex-1 transition-colors duration-200 text-[var(--text-primary)] group-hover:text-[var(--accent-green-light)]"
                style={{ fontSize: "clamp(1.45rem, 5.5vw, 1.9rem)" }}
              >
                {t(link.key)}
              </span>
              <Chevron
                size={20}
                className={chevronClass}
                style={{ color: "var(--accent-green-light)" }}
              />
            </a>
          ))}

          {/* Account action */}
          <div style={itemStyle(navLinks.length)}>
            {isAuthenticated ? (
              <>
                <a
                  href="/profile"
                  className="group flex items-center gap-4 no-underline"
                  style={{ padding: "0.85rem 0", borderBottom: HAIRLINE }}
                >
                  <User
                    size={20}
                    style={{ color: "var(--accent-green-light)" }}
                  />
                  <span
                    className="flex-1 transition-colors duration-200 text-[var(--text-primary)] group-hover:text-[var(--accent-green-light)]"
                    style={{ fontSize: "1.15rem" }}
                  >
                    {t("nav.account")}
                  </span>
                  <Chevron
                    size={18}
                    className={chevronClass}
                    style={{ color: "var(--accent-green-light)" }}
                  />
                </a>
                <button
                  onClick={() => {
                    onClose();
                    onLogout?.();
                  }}
                  disabled={logoutPending}
                  className="group flex items-center gap-4 w-full bg-transparent border-none cursor-pointer text-start"
                  style={{ padding: "0.85rem 0" }}
                >
                  <LogOut
                    size={20}
                    style={{ color: "var(--accent-terracotta)" }}
                  />
                  <span
                    className="flex-1 transition-colors duration-200 text-[var(--text-secondary)] group-hover:text-[var(--accent-terracotta)]"
                    style={{ fontSize: "1.15rem" }}
                  >
                    {logoutPending ? "..." : t("login.logout")}
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onLoginClick?.();
                }}
                className="w-full flex items-center justify-center gap-2.5 rounded-full border-none cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{
                  marginTop: "1.75rem",
                  padding: "0.95rem 1.5rem",
                  background: "var(--accent-green)",
                  color: "#ffffff",
                  fontSize: "1rem",
                  letterSpacing: "0.02em",
                }}
              >
                <LogIn size={18} />
                {t("nav.login")}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Footer: language + theme */}
      <footer
        className="shrink-0"
        style={{
          padding: "1.1rem var(--page-margin)",
          paddingBottom: "max(1.1rem, env(safe-area-inset-bottom))",
          borderTop: HAIRLINE,
        }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 w-full"
          style={{ ...itemStyle(navLinks.length + 1), maxWidth: "480px" }}
        >
          {/* Language segmented control */}
          <div
            className="flex items-center rounded-full"
            style={{
              border: "1px solid rgba(128, 128, 128, 0.25)",
              padding: "3px",
            }}
            role="group"
            aria-label="Language"
          >
            {langOptions.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
                className="rounded-full border-none cursor-pointer transition-all duration-200"
                style={{
                  padding: "0.4rem 0.85rem",
                  fontSize: "0.8rem",
                  background:
                    lang === l.code ? "var(--accent-green)" : "transparent",
                  color: lang === l.code ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Theme toggle - cycles dark -> light -> auto */}
          <button
            onClick={cycle}
            className="flex items-center gap-2.5 rounded-full border-none cursor-pointer transition-colors duration-200 hover:bg-[var(--bg-surface-light)]"
            style={{
              padding: "0.5rem 0.9rem",
              border: "1px solid rgba(128, 128, 128, 0.25)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
            aria-label={
              isAuto
                ? t("theme.auto_mode")
                : isLight
                  ? t("theme.dark_mode")
                  : t("theme.light_mode")
            }
          >
            {isAuto ? (
              <svg
                width="15"
                height="15"
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
                width="15"
                height="15"
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
                width="15"
                height="15"
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
            <span className="text-sm">
              {isAuto
                ? t("theme.auto_mode")
                : isLight
                  ? t("theme.dark_mode")
                  : t("theme.light_mode")}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}
