import { useLanguage } from '@/hooks/useLanguage';
import { langs } from "@/const";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({
  className = "",
}: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`flex items-center gap-1 font-mono text-xs ${className}`}
      style={{ color: "var(--text-tertiary)" }}
    >
      {langs.map((l, i) => (
        <span key={l} className="flex items-center">
          <button
            onClick={() => setLang(l)}
            className="transition-colors duration-200 hover:text-[var(--text-primary)]"
            style={{
              color:
                lang === l ? "var(--text-primary)" : "var(--text-secondary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              letterSpacing: "0.08em",
            }}
            aria-pressed={lang === l}
          >
            {l.toUpperCase()}
          </button>
          {i < langs.length - 1 && <span className="mx-1.5">|</span>}
        </span>
      ))}
    </div>
  );
}
