import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md";
}

export default function Logo({ className, size = "md" }: LogoProps) {
  const leafSize = size === "sm" ? 28 : 34;
  const titleClass = size === "sm" ? "text-[15px]" : "text-lg";
  const taglineClass = size === "sm" ? "text-[8px] tracking-[0.16em]" : "text-[9px] tracking-[0.18em]";

  return (
    <span
      className={cn("inline-flex items-center gap-2 no-underline", className)}
    >
      <svg
        width={leafSize}
        height={leafSize}
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: "var(--accent-green-light)" }}
      >
        <path
          d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
          fill="currentColor"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={cn("font-display tracking-tight", titleClass)}
          style={{ color: "var(--text-primary)" }}
        >
          GREEN
        </span>
        <span
          className={cn("uppercase font-medium", taglineClass)}
          style={{ color: "var(--accent-green-light)" }}
        >
          Clean Meknes
        </span>
      </span>
    </span>
  );
}
