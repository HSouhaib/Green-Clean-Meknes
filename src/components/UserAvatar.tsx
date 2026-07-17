import { useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export default function UserAvatar({
  src,
  name,
  className = "",
  style,
}: UserAvatarProps) {
  const [broken, setBroken] = useState(!src);
  const initial = (name?.trim()?.[0] ?? "").toUpperCase();

  if (broken) {
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center",
          className
        )}
        style={{ background: "var(--bg-surface-light)", ...style }}
      >
        {initial ? (
          <span
            className="font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            {initial}
          </span>
        ) : (
          <User
            className="w-1/2 h-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
        )}
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt=""
      className={cn("rounded-full object-cover", className)}
      style={style}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
