import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { WeatherData } from "@/hooks/useWeather";

interface TreeCanvasProps {
  weather?: WeatherData;
}

export default function TreeCanvas({ weather }: TreeCanvasProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLight, setIsLight] = useState(false);

  const w = weather;
  const weatherType = w?.weatherType ?? "clear";
  const isDay = w?.isDay ?? true;
  const temperature = w?.temperature ?? 28;
  const windSpeed = w?.windspeed ?? 8;
  const season = w?.season ?? "summer";

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsLight(
        document.documentElement.getAttribute("data-theme") === "light"
      );
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Smooth lerp animation loop
  useEffect(() => {
    const animate = () => {
      const lerp = 0.04;
      currentRef.current.x +=
        (mouseRef.current.x - currentRef.current.x) * lerp;
      currentRef.current.y +=
        (mouseRef.current.y - currentRef.current.y) * lerp;

      const treeEl = containerRef.current?.querySelector(
        ".tree-svg"
      ) as SVGElement | null;
      if (treeEl) {
        const offsetX = (currentRef.current.x - 0.5) * 40;
        const offsetY = (currentRef.current.y - 0.5) * 25;
        const rotate = (currentRef.current.x - 0.5) * 4;
        treeEl.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // --- Dynamic color computation based on weather + season + theme ---

  // Background gradient: sky colors that change with weather and time of day
  const getBgGradient = () => {
    // Night overrides
    if (!isDay) {
      if (weatherType === "clear") {
        return isLight
          ? "radial-gradient(ellipse at 50% 100%, #c8d8e8 0%, #a8b8c8 30%, #8898a8 60%, #687888 100%)"
          : "radial-gradient(ellipse at 50% 100%, #1a2540 0%, #0d1528 50%, #050a15 100%)";
      }
      if (weatherType === "cloudy") {
        return isLight
          ? "radial-gradient(ellipse at 50% 100%, #b8c8d8 0%, #98a8b8 30%, #788898 60%, #586878 100%)"
          : "radial-gradient(ellipse at 50% 100%, #1a2030 0%, #0d1218 50%, #050810 100%)";
      }
      if (weatherType === "rain" || weatherType === "thunderstorm") {
        return isLight
          ? "radial-gradient(ellipse at 50% 100%, #a0b0c0 0%, #8090a0 30%, #607080 60%, #405060 100%)"
          : "radial-gradient(ellipse at 50% 100%, #0f1828 0%, #080f18 50%, #030508 100%)";
      }
      return isLight
        ? "radial-gradient(ellipse at 50% 100%, #c8d8e8 0%, #a8b8c8 50%, #687888 100%)"
        : "radial-gradient(ellipse at 50% 100%, #1a2540 0%, #0d1528 50%, #050a15 100%)";
    }

    // Daytime
    if (weatherType === "clear") {
      // Hot days get warmer tones
      if (temperature > 30) {
        return isLight
          ? "radial-gradient(ellipse at 50% 100%, #f0e8c8 0%, #e8d8a0 30%, #d8c880 60%, #c8b860 100%)"
          : "radial-gradient(ellipse at 50% 100%, #2a2010 0%, #1a1508 50%, #0a0804 100%)";
      }
      return isLight
        ? "radial-gradient(ellipse at 50% 100%, #e8f5e0 0%, #d0e8c0 30%, #c0dcc0 60%, #b0d0b0 100%)"
        : "radial-gradient(ellipse at 50% 100%, #1a3a1a 0%, #0a1a0a 50%, #050a05 100%)";
    }

    if (weatherType === "cloudy") {
      return isLight
        ? "radial-gradient(ellipse at 50% 100%, #d8e0d8 0%, #c0ccc0 30%, #a8b8a8 60%, #90a090 100%)"
        : "radial-gradient(ellipse at 50% 100%, #1a2a1a 0%, #0f1a0f 50%, #080f08 100%)";
    }

    if (weatherType === "rain") {
      return isLight
        ? "radial-gradient(ellipse at 50% 100%, #c8d4c8 0%, #a8b8a8 30%, #889888 60%, #687868 100%)"
        : "radial-gradient(ellipse at 50% 100%, #0f1a0f 0%, #080f08 50%, #040804 100%)";
    }

    if (weatherType === "snow") {
      return isLight
        ? "radial-gradient(ellipse at 50% 100%, #e8f0f8 0%, #d0e0f0 30%, #b8d0e8 60%, #a0c0e0 100%)"
        : "radial-gradient(ellipse at 50% 100%, #1a2535 0%, #0f1828 50%, #080c18 100%)";
    }

    if (weatherType === "thunderstorm") {
      return isLight
        ? "radial-gradient(ellipse at 50% 100%, #b8c0b8 0%, #98a098 30%, #788078 60%, #586058 100%)"
        : "radial-gradient(ellipse at 50% 100%, #0f140f 0%, #080a08 50%, #040504 100%)";
    }

    // Default
    return isLight
      ? "radial-gradient(ellipse at 50% 100%, #e8f5e0 0%, #d0e8c0 30%, #c0dcc0 60%, #b0d0b0 100%)"
      : "radial-gradient(ellipse at 50% 100%, #1a3a1a 0%, #0a1a0a 50%, #050a05 100%)";
  };

  // Season-affected foliage colors
  const getFoliageColors = () => {
    const base = {
      light: {
        f1s: "#7ab86a",
        f1m: "#5a9850",
        f1e: "#3a7830",
        f2s: "#8ac87a",
        f2m: "#6aa860",
        f2e: "#4a8840",
        f3s: "#9ad88a",
        f3m: "#7ab86a",
        f3e: "#5a9850",
      },
      dark: {
        f1s: "#4a7a3a",
        f1m: "#2d5a1a",
        f1e: "#1a3a0a",
        f2s: "#5a8a4a",
        f2m: "#3a6a2a",
        f2e: "#1a3a0a",
        f3s: "#6b9f5a",
        f3m: "#4a7a3a",
        f3e: "#2a4a1a",
      },
    };

    // Season overrides
    if (season === "autumn") {
      return isLight
        ? {
            f1s: "#c8a040",
            f1m: "#b08030",
            f1e: "#986820",
            f2s: "#d8b050",
            f2m: "#c09040",
            f2e: "#a87830",
            f3s: "#e0c060",
            f3m: "#d0a850",
            f3e: "#b89040",
          }
        : {
            f1s: "#8a6a2a",
            f1m: "#6a5018",
            f1e: "#4a3810",
            f2s: "#9a7a3a",
            f2m: "#7a6028",
            f2e: "#5a4818",
            f3s: "#a88a4a",
            f3m: "#8a7038",
            f3e: "#6a5828",
          };
    }

    if (season === "winter") {
      return isLight
        ? {
            f1s: "#a8b8a0",
            f1m: "#889878",
            f1e: "#687850",
            f2s: "#b8c8b0",
            f2m: "#98a888",
            f2e: "#788860",
            f3s: "#c8d8c0",
            f3m: "#a8b8a0",
            f3e: "#889878",
          }
        : {
            f1s: "#4a5a42",
            f1m: "#3a4a32",
            f1e: "#2a3a22",
            f2s: "#5a6a52",
            f2m: "#4a5a42",
            f2e: "#3a4a32",
            f3s: "#6a7a62",
            f3m: "#5a6a52",
            f3e: "#4a5a42",
          };
    }

    if (season === "spring") {
      return isLight
        ? {
            f1s: "#88d878",
            f1m: "#68b858",
            f1e: "#489838",
            f2s: "#98e888",
            f2m: "#78c868",
            f2e: "#58a848",
            f3s: "#a8f898",
            f3m: "#88d878",
            f3e: "#68b858",
          }
        : {
            f1s: "#4a8a3a",
            f1m: "#3a6a2a",
            f1e: "#2a4a1a",
            f2s: "#5a9a4a",
            f2m: "#4a7a3a",
            f2e: "#3a5a2a",
            f3s: "#6aaa5a",
            f3m: "#5a9a4a",
            f3e: "#4a7a3a",
          };
    }

    // Summer (default) - hot days get warmer tones
    if (temperature > 30) {
      return isLight
        ? {
            f1s: "#90b860",
            f1m: "#709840",
            f1e: "#507820",
            f2s: "#a0c870",
            f2m: "#80a850",
            f2e: "#608830",
            f3s: "#b0d880",
            f3m: "#90b860",
            f3e: "#709840",
          }
        : {
            f1s: "#4a6a2a",
            f1m: "#3a5a1a",
            f1e: "#2a4a0a",
            f2s: "#5a7a3a",
            f2m: "#4a6a2a",
            f2e: "#3a5a1a",
            f3s: "#6a8a4a",
            f3m: "#5a7a3a",
            f3e: "#4a6a2a",
          };
    }

    return isLight ? base.light : base.dark;
  };

  const foliage = getFoliageColors();

  // Squirrel colors shift with season and weather
  const getSquirrelColors = () => {
    const base =
      season === "autumn"
        ? {
            body: "#A06B3F",
            dark: "#6B4528",
            belly: "#D4A87C",
            tail: "#9A5E35",
            tailHighlight: "#C89A6A",
          }
        : season === "winter"
          ? {
              body: "#8A7A6A",
              dark: "#5A5048",
              belly: "#B8A898",
              tail: "#7A6A5A",
              tailHighlight: "#A89888",
            }
          : season === "spring"
            ? {
                body: "#B0784A",
                dark: "#7A4F2E",
                belly: "#E0B890",
                tail: "#A06638",
                tailHighlight: "#D4A070",
              }
            : {
                body: "#9B6B3F",
                dark: "#6B4A2A",
                belly: "#C9A87C",
                tail: "#8A5E35",
                tailHighlight: "#B88A5A",
              };

    if (weatherType === "rain" || weatherType === "thunderstorm") {
      return {
        body: base.body,
        dark: base.dark,
        belly: base.belly,
        tail: base.tail,
        tailHighlight: base.tailHighlight,
        overlay: isLight ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.2)",
      };
    }
    if (weatherType === "snow") {
      return {
        body: base.body,
        dark: base.dark,
        belly: base.belly,
        tail: base.tail,
        tailHighlight: base.tailHighlight,
        overlay: isLight ? "rgba(255,255,255,0.1)" : "rgba(200,210,230,0.1)",
      };
    }
    return { ...base, overlay: "transparent" };
  };

  const sq = getSquirrelColors();

  const bgGradient = getBgGradient();
  const groundColor = isLight ? "#a0c090" : "#1a2a12";
  const rootColor = isLight ? "#8a6a4a" : "#3d2817";
  const trunkStart = isLight ? "#7a5a3a" : "#3d2817";
  const trunkMid = isLight ? "#9a7a5a" : "#5a3d28";
  const trunkEnd = isLight ? "#7a5a3a" : "#3d2817";
  const branchColor = isLight ? "#8a6a4a" : "#4a3520";
  const twigColor = isLight ? "#9a7a5a" : "#5a4530";
  const textureColor = isLight ? "#6a5a4a" : "#2a1a0f";
  const fireflyColor = isLight ? "#e8c060" : "#c9a84c";
  const leafColors =
    season === "autumn"
      ? ["#b08030", "#c8a040", "#986820", "#d8b050", "#a87830", "#c09040"]
      : ["#e8b8c8", "#f0c8d8", "#e0a8b8", "#f0d0dc", "#e8bcc8", "#d8a0b0"];
  const vignette = isLight
    ? "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(180,200,170,0.3) 100%)"
    : "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)";

  // Weather overlay: darken during rain/storm
  const getWeatherOverlay = () => {
    if (weatherType === "rain") {
      return isLight ? "rgba(100,110,120,0.15)" : "rgba(0,0,0,0.2)";
    }
    if (weatherType === "thunderstorm") {
      return isLight ? "rgba(80,80,90,0.2)" : "rgba(0,0,0,0.3)";
    }
    if (weatherType === "snow") {
      return isLight ? "rgba(200,210,230,0.1)" : "rgba(100,120,150,0.1)";
    }
    return "transparent";
  };

  // Tree sway speed based on wind
  const swayDuration = Math.max(2, 6 - windSpeed / 10);

  // Show sun/moon based on isDay from weather, not just theme
  const showSun =
    isDay &&
    weatherType !== "rain" &&
    weatherType !== "thunderstorm" &&
    weatherType !== "snow";
  const showMoon = !isDay && weatherType !== "thunderstorm";

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 1.5s ease-out",
      }}
    >
      {/* Background gradient - weather + theme aware */}
      <div
        className="absolute inset-0"
        style={{
          background: bgGradient,
          transition: "background 2s ease-out",
        }}
      />

      {/* Weather color overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: getWeatherOverlay(),
          transition: "background-color 2s ease-out",
        }}
      />

      {/* Sun / Moon - based on actual day/night, not theme */}
      {(showSun || showMoon) && (
        <div
          className="absolute"
          style={{
            top: "8%",
            right: "15%",
            width: "80px",
            height: "80px",
            opacity: isVisible ? 0.9 : 0,
            transition: "opacity 1.5s ease-out",
            animation: "celestialFloat 8s ease-in-out infinite",
          }}
        >
          {showSun ? (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    stopColor={temperature > 30 ? "#ffd060" : "#f5d76e"}
                  />
                  <stop
                    offset="50%"
                    stopColor={temperature > 30 ? "#f0a830" : "#e8c040"}
                  />
                  <stop
                    offset="100%"
                    stopColor={temperature > 30 ? "#e08020" : "#d4a820"}
                  />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="30" fill="url(#sunGrad)" opacity="0.9">
                <animate
                  attributeName="r"
                  values="30;32;30"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
              <g
                stroke={temperature > 30 ? "#f0a830" : "#e8c040"}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              >
                <line x1="50" y1="5" x2="50" y2="15">
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </line>
                <line x1="50" y1="85" x2="50" y2="95">
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="0.5s"
                  />
                </line>
                <line x1="5" y1="50" x2="15" y2="50">
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="1s"
                  />
                </line>
                <line x1="85" y1="50" x2="95" y2="50">
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="1.5s"
                  />
                </line>
                <line x1="18" y1="18" x2="25" y2="25">
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="0.3s"
                  />
                </line>
                <line x1="75" y1="75" x2="82" y2="82">
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="0.8s"
                  />
                </line>
                <line x1="82" y1="18" x2="75" y2="25">
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="1.2s"
                  />
                </line>
                <line x1="25" y1="75" x2="18" y2="82">
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="1.7s"
                  />
                </line>
              </g>
            </svg>
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <radialGradient id="moonGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e8e8d0" />
                  <stop offset="60%" stopColor="#c8c8a8" />
                  <stop offset="100%" stopColor="#a8a888" />
                </radialGradient>
                <filter
                  id="moonGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="28"
                fill="url(#moonGrad)"
                filter="url(#moonGlow)"
                opacity="0.9"
              >
                <animate
                  attributeName="r"
                  values="28;30;28"
                  dur="5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="40" cy="42" r="4" fill="#b8b898" opacity="0.5" />
              <circle cx="55" cy="38" r="3" fill="#b8b898" opacity="0.4" />
              <circle cx="48" cy="55" r="5" fill="#b8b898" opacity="0.3" />
              <circle cx="58" cy="52" r="2.5" fill="#b8b898" opacity="0.4" />
              <circle cx="35" cy="55" r="2" fill="#b8b898" opacity="0.3" />
            </svg>
          )}
        </div>
      )}

      <style>{`
        @keyframes celestialFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* Floating particles - adjusted for weather */}
      <Particles isLight={isLight} weatherType={weatherType} />

      {/* SVG Tree */}
      <svg
        viewBox="0 0 800 800"
        className="tree-svg absolute"
        style={{
          width: "100%",
          height: "100%",
          left: 0,
          top: 0,
          willChange: "transform",
        }}
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={trunkStart} />
            <stop offset="50%" stopColor={trunkMid} />
            <stop offset="100%" stopColor={trunkEnd} />
          </linearGradient>

          <radialGradient id="foliageGrad1" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={foliage.f1s} />
            <stop offset="50%" stopColor={foliage.f1m} />
            <stop offset="100%" stopColor={foliage.f1e} />
          </radialGradient>

          <radialGradient id="foliageGrad2" cx="40%" cy="20%" r="60%">
            <stop offset="0%" stopColor={foliage.f2s} />
            <stop offset="60%" stopColor={foliage.f2m} />
            <stop offset="100%" stopColor={foliage.f2e} />
          </radialGradient>

          <radialGradient id="foliageGrad3" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={foliage.f3s} />
            <stop offset="50%" stopColor={foliage.f3m} />
            <stop offset="100%" stopColor={foliage.f3e} />
          </radialGradient>
        </defs>

        <ellipse
          cx="400"
          cy="760"
          rx="300"
          ry="30"
          fill={groundColor}
          opacity="0.6"
        />

        <g opacity="0.5">
          <path
            d="M 380 750 Q 340 770 300 780"
            stroke={rootColor}
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M 420 750 Q 460 770 500 780"
            stroke={rootColor}
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M 390 750 Q 360 775 330 785"
            stroke={rootColor}
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M 410 750 Q 440 775 470 785"
            stroke={rootColor}
            strokeWidth="3"
            fill="none"
          />
        </g>

        <path
          d="M 400 750 Q 395 700 390 650 Q 385 600 388 550 Q 390 500 395 450 Q 398 400 400 350 Q 402 300 400 250"
          stroke="url(#trunkGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
        />

        <path
          d="M 392 700 Q 388 650 390 600"
          stroke={textureColor}
          strokeWidth="2"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M 408 720 Q 412 670 410 620"
          stroke={textureColor}
          strokeWidth="2"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M 395 600 Q 393 550 397 500"
          stroke={textureColor}
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />

        <g
          stroke={branchColor}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M 392 550 Q 350 520 310 480" />
          <path d="M 390 480 Q 340 450 290 410" />
          <path d="M 395 400 Q 350 360 300 320" />
          <path d="M 398 330 Q 360 290 320 250" />
          <path d="M 408 520 Q 450 490 490 450" />
          <path d="M 410 460 Q 460 430 500 390" />
          <path d="M 405 380 Q 450 340 490 300" />
          <path d="M 402 300 Q 440 260 480 220" />
        </g>

        <g stroke={twigColor} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M 310 480 Q 280 460 260 440" />
          <path d="M 290 410 Q 260 390 240 370" />
          <path d="M 300 320 Q 270 300 250 280" />
          <path d="M 320 250 Q 290 230 270 210" />
          <path d="M 490 450 Q 520 430 540 410" />
          <path d="M 500 390 Q 530 370 550 350" />
          <path d="M 490 300 Q 520 280 540 260" />
          <path d="M 480 220 Q 510 200 530 180" />
        </g>

        <g stroke={twigColor} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M 310 480 Q 280 460 260 440" />
          <path d="M 290 410 Q 260 390 240 370" />
          <path d="M 300 320 Q 270 300 250 280" />
          <path d="M 320 250 Q 290 230 270 210" />
          <path d="M 490 450 Q 520 430 540 410" />
          <path d="M 500 390 Q 530 370 550 350" />
          <path d="M 490 300 Q 520 280 540 260" />
          <path d="M 480 220 Q 510 200 530 180" />
        </g>

        <g className="tree-gust">
          <g
            className="tree-foliage"
            style={{ animationDuration: `${swayDuration}s` }}
          >
            <ellipse
              cx="280"
              cy="450"
              rx="70"
              ry="60"
              fill="url(#foliageGrad1)"
              opacity="0.9"
            />
            <ellipse
              cx="310"
              cy="430"
              rx="55"
              ry="50"
              fill="url(#foliageGrad2)"
              opacity="0.85"
            />
            <ellipse
              cx="520"
              cy="430"
              rx="75"
              ry="65"
              fill="url(#foliageGrad1)"
              opacity="0.9"
            />
            <ellipse
              cx="490"
              cy="410"
              rx="60"
              ry="55"
              fill="url(#foliageGrad3)"
              opacity="0.85"
            />
            <ellipse
              cx="260"
              cy="350"
              rx="65"
              ry="55"
              fill="url(#foliageGrad2)"
              opacity="0.9"
            />
            <ellipse
              cx="290"
              cy="330"
              rx="50"
              ry="45"
              fill="url(#foliageGrad1)"
              opacity="0.85"
            />
            <ellipse
              cx="540"
              cy="350"
              rx="70"
              ry="60"
              fill="url(#foliageGrad2)"
              opacity="0.9"
            />
            <ellipse
              cx="510"
              cy="330"
              rx="55"
              ry="50"
              fill="url(#foliageGrad3)"
              opacity="0.85"
            />
            <ellipse
              cx="270"
              cy="250"
              rx="60"
              ry="50"
              fill="url(#foliageGrad3)"
              opacity="0.9"
            />
            <ellipse
              cx="300"
              cy="230"
              rx="45"
              ry="40"
              fill="url(#foliageGrad1)"
              opacity="0.85"
            />
            <ellipse
              cx="530"
              cy="250"
              rx="65"
              ry="55"
              fill="url(#foliageGrad3)"
              opacity="0.9"
            />
            <ellipse
              cx="500"
              cy="230"
              rx="50"
              ry="45"
              fill="url(#foliageGrad2)"
              opacity="0.85"
            />
            <ellipse
              cx="400"
              cy="180"
              rx="80"
              ry="70"
              fill="url(#foliageGrad2)"
              opacity="0.95"
            />
            <ellipse
              cx="370"
              cy="160"
              rx="55"
              ry="50"
              fill="url(#foliageGrad3)"
              opacity="0.9"
            />
            <ellipse
              cx="430"
              cy="160"
              rx="55"
              ry="50"
              fill="url(#foliageGrad1)"
              opacity="0.9"
            />
            <ellipse
              cx="400"
              cy="140"
              rx="45"
              ry="40"
              fill="url(#foliageGrad3)"
              opacity="0.85"
            />
            <ellipse
              cx="350"
              cy="300"
              rx="50"
              ry="45"
              fill="url(#foliageGrad1)"
              opacity="0.8"
            />
            <ellipse
              cx="450"
              cy="300"
              rx="50"
              ry="45"
              fill="url(#foliageGrad2)"
              opacity="0.8"
            />
            <ellipse
              cx="400"
              cy="280"
              rx="55"
              ry="50"
              fill="url(#foliageGrad3)"
              opacity="0.85"
            />
            <ellipse
              cx="400"
              cy="380"
              rx="60"
              ry="50"
              fill="url(#foliageGrad1)"
              opacity="0.75"
            />
          </g>
        </g>

        {/* ─── Barbary Ground Squirrel ─── */}
        <g
          opacity={isVisible ? (isDay ? 1 : 0.85) : 0}
          style={{ transition: "opacity 1.5s ease-out" }}
        >
          {isDay ? (
            /* Day: Barbary ground squirrel — side view, ground script */
            <g transform="scale(2.8)">
              <g className="sq-pos">
                <g className="sq-face">
                  {/* Sit-up pose (idle, forage) */}
                  <g className="sq-sit">
                    <g className="sq-squash">
                      {/* Tail — bushy plume carried behind */}
                      <g className="sq-tail-lift">
                        <g className="sq-tail-sway">
                          <path
                            d="M -4.5 -2.5 C -11 -1.5, -16.5 -4.5, -17.5 -10 C -18.2 -14.5, -15.5 -18.3, -11.3 -17.9 C -8.3 -17.6, -6.6 -15.6, -7.3 -12.8 C -8 -10, -7.4 -6, -5.4 -3.4 C -5 -2.9, -4.7 -2.6, -4.5 -2.5 Z"
                            fill={sq.tail}
                          />
                          <path
                            d="M -7.6 -4.5 C -12 -5.5, -15.2 -8.5, -15.6 -12.3"
                            fill="none"
                            stroke={sq.tailHighlight}
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            opacity="0.5"
                          />
                          <path
                            d="M -6.8 -3.2 C -10.5 -3.8, -13.6 -6, -14.6 -9"
                            fill="none"
                            stroke={sq.tailHighlight}
                            strokeWidth="1.1"
                            strokeLinecap="round"
                            opacity="0.4"
                          />
                          {/* Banded tail markings */}
                          <path
                            d="M -15.5 -6.5 C -13 -7.8, -10.5 -8.5, -8.5 -8.7"
                            fill="none"
                            stroke={sq.tailHighlight}
                            strokeWidth="0.9"
                            strokeLinecap="round"
                            opacity="0.45"
                          />
                          <path
                            d="M -17 -11 C -14.5 -12.3, -11.5 -12.8, -8.8 -12.6"
                            fill="none"
                            stroke={sq.tailHighlight}
                            strokeWidth="0.9"
                            strokeLinecap="round"
                            opacity="0.4"
                          />
                        </g>
                      </g>

                      {/* Hind foot planted on the ground */}
                      <path
                        d="M -3 -0.15 C -3.4 -1.9, -1.8 -2.9, 0.4 -2.5 C 2.8 -2.1, 5 -1.2, 5.4 -0.25 C 3 0.25, -1.4 0.3, -3 -0.15 Z"
                        fill={sq.dark}
                      />
                      {/* Toes */}
                      <path
                        d="M 4.5 -0.12 L 4.4 -0.9 M 5.2 -0.1 L 5.2 -0.85"
                        fill="none"
                        stroke="#3a2415"
                        strokeWidth="0.22"
                        strokeLinecap="round"
                        opacity="0.7"
                      />

                      {/* Body + head (tilts forward to forage) */}
                      <g className="sq-tilt">
                        <g className="sq-breathe">
                          <path
                            d="M -5.5 0 C -8 -0.3, -9.8 -2.8, -9.6 -6.2 C -9.4 -9.8, -7.2 -12.6, -4 -13.8 C -1.8 -14.6, 0.6 -14.4, 2.2 -13.2 C 4.3 -11.6, 5.4 -8.6, 5 -5 C 4.7 -2.2, 3.6 -0.5, 2 0 L -5.5 0 Z"
                            fill={sq.body}
                          />
                          <ellipse
                            cx="1.8"
                            cy="-6.5"
                            rx="2.2"
                            ry="4.6"
                            transform="rotate(6 1.8 -6.5)"
                            fill={sq.belly}
                            opacity="0.5"
                          />
                          {/* Pale dorsal stripes */}
                          <path
                            d="M -8.2 -5 C -7.8 -8.5, -6 -11.8, -3.4 -13.2"
                            fill="none"
                            stroke={sq.belly}
                            strokeWidth="1.05"
                            strokeLinecap="round"
                            opacity="0.55"
                          />
                          <path
                            d="M -7 -3.4 C -6.6 -7, -4.8 -10.4, -2 -11.8"
                            fill="none"
                            stroke={sq.belly}
                            strokeWidth="1.05"
                            strokeLinecap="round"
                            opacity="0.45"
                          />
                          {/* Haunch curve */}
                          <path
                            d="M -5.2 -1.2 C -6.8 -2.8, -7.4 -5.4, -6.6 -8"
                            fill="none"
                            stroke={sq.dark}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            opacity="0.35"
                          />
                          {/* Forepaws held at the chest */}
                          <ellipse
                            cx="4.5"
                            cy="-9.6"
                            rx="0.8"
                            ry="1.6"
                            transform="rotate(-20 4.5 -9.6)"
                            fill={sq.belly}
                          />
                          <ellipse
                            cx="5.2"
                            cy="-8.2"
                            rx="0.75"
                            ry="1.45"
                            transform="rotate(-14 5.2 -8.2)"
                            fill={sq.belly}
                            opacity="0.85"
                          />

                          {/* Head */}
                          <g className="sq-head">
                            <circle
                              cx="0.2"
                              cy="-18.9"
                              r="0.9"
                              fill={sq.dark}
                              opacity="0.35"
                            />
                            <circle
                              cx="2.6"
                              cy="-16.4"
                              r="3.7"
                              fill={sq.body}
                            />
                            <ellipse
                              cx="5.5"
                              cy="-15.5"
                              rx="1.85"
                              ry="1.45"
                              fill={sq.body}
                            />
                            <ellipse
                              cx="4"
                              cy="-14.9"
                              rx="1.15"
                              ry="0.85"
                              fill={sq.belly}
                              opacity="0.35"
                            />
                            <g className="sq-ear">
                              <path
                                d="M 0.6 -19.2 C -0.3 -21.4, 0.8 -22.9, 2.2 -22.4 C 3.3 -22, 3.5 -20.5, 2.8 -19.1 Z"
                                fill={sq.body}
                              />
                              <path
                                d="M 1.3 -19.7 C 1 -20.9, 1.7 -21.7, 2.4 -21.3 C 2.9 -21, 2.9 -20.1, 2.5 -19.4 Z"
                                fill={sq.dark}
                                opacity="0.5"
                              />
                              {/* Ear tip */}
                              <path
                                d="M 0.4 -20.6 C 0.7 -21.7, 1.6 -22.3, 2.3 -21.9"
                                fill="none"
                                stroke={sq.dark}
                                strokeWidth="0.6"
                                strokeLinecap="round"
                                opacity="0.55"
                              />
                            </g>
                            <circle
                              cx="7.2"
                              cy="-15.8"
                              r="0.52"
                              fill="#3a2415"
                            />
                            {/* Mouth */}
                            <path
                              d="M 7 -15.2 Q 6.5 -14.6 5.8 -14.5"
                              fill="none"
                              stroke="#3a2415"
                              strokeWidth="0.28"
                              strokeLinecap="round"
                              opacity="0.65"
                            />
                            {/* Blinking eye */}
                            <g className="sq-blink">
                              <circle
                                cx="3.5"
                                cy="-17"
                                r="0.68"
                                fill="#2a1a10"
                              />
                              <circle
                                cx="3.74"
                                cy="-17.26"
                                r="0.23"
                                fill="#ffffff"
                                opacity="0.9"
                              />
                            </g>
                            {/* Whiskers */}
                            <path
                              d="M 6.2 -15.1 L 9.3 -14.4 M 6.2 -15.4 L 9.5 -15.6 M 6.2 -15.7 L 9.1 -16.9"
                              fill="none"
                              stroke="#d8d0c8"
                              strokeWidth="0.18"
                              strokeLinecap="round"
                              opacity="0.55"
                            />
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>

                  {/* Quadruped walk pose (travel on all fours) */}
                  <g className="sq-walk">
                    <g className="sq-walk-bob">
                      {/* Tail carried low, flowing behind */}
                      <g className="sq-walk-tail">
                        <path
                          d="M -8.5 -5 C -13.5 -3.8, -18 -5.8, -19.5 -10.2 C -20.5 -13.6, -18.2 -16.8, -14.5 -16 C -11.8 -15.4, -10.8 -13, -11.4 -10.3 C -12 -7.6, -10.6 -5.6, -8.5 -5 Z"
                          fill={sq.tail}
                        />
                        <path
                          d="M -11 -6.2 C -14 -6.6, -16.8 -8.4, -17.6 -11.3"
                          fill="none"
                          stroke={sq.tailHighlight}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          opacity="0.5"
                        />
                        <path
                          d="M -18.6 -8.8 C -16.2 -10.4, -13.4 -11, -11.4 -10.6"
                          fill="none"
                          stroke={sq.tailHighlight}
                          strokeWidth="0.9"
                          strokeLinecap="round"
                          opacity="0.4"
                        />
                      </g>

                      {/* Far-side legs (behind the body) */}
                      <g className="sq-leg-b">
                        <path
                          d="M -6.8 -5.4 L -7.9 -2.8 L -5.8 -0.5"
                          fill="none"
                          stroke={sq.dark}
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.55"
                        />
                      </g>
                      <g className="sq-leg-a">
                        <path
                          d="M 3.4 -5 L 2.8 -2.6 L 4 -0.5"
                          fill="none"
                          stroke={sq.dark}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.55"
                        />
                      </g>

                      {/* Body */}
                      <path
                        d="M -8.5 -3 C -10.5 -4.5, -10.5 -7.5, -8 -9 C -5.5 -10.4, -1 -10.8, 2.5 -10 C 5 -9.4, 6.8 -7.8, 7 -5.8 C 7.2 -4.2, 6 -2.6, 3.5 -2 C 0 -1.3, -4 -1.4, -6.5 -1.9 C -7.8 -2.2, -8.3 -2.5, -8.5 -3 Z"
                        fill={sq.body}
                      />
                      <ellipse
                        cx="-0.5"
                        cy="-3"
                        rx="3.4"
                        ry="1"
                        fill={sq.belly}
                        opacity="0.35"
                      />
                      <path
                        d="M -7.5 -8.2 C -4 -9.6, 0.5 -9.9, 3.5 -9"
                        fill="none"
                        stroke={sq.belly}
                        strokeWidth="1.05"
                        strokeLinecap="round"
                        opacity="0.55"
                      />
                      <path
                        d="M -8 -6.6 C -4.5 -8, 0 -8.3, 4 -7.4"
                        fill="none"
                        stroke={sq.belly}
                        strokeWidth="1.05"
                        strokeLinecap="round"
                        opacity="0.45"
                      />

                      {/* Head */}
                      <circle
                        cx="5.2"
                        cy="-13.2"
                        r="0.88"
                        fill={sq.dark}
                        opacity="0.35"
                      />
                      <circle cx="7.4" cy="-10.2" r="3.6" fill={sq.body} />
                      <ellipse
                        cx="10.3"
                        cy="-9.2"
                        rx="1.9"
                        ry="1.5"
                        fill={sq.body}
                      />
                      <ellipse
                        cx="9"
                        cy="-8.7"
                        rx="1.15"
                        ry="0.85"
                        fill={sq.belly}
                        opacity="0.35"
                      />
                      <path
                        d="M 5.2 -12.6 C 4.8 -14.9, 6 -16.2, 7.3 -15.5 C 8.2 -15, 8.3 -13.6, 7.7 -12.5 Z"
                        fill={sq.body}
                      />
                      <path
                        d="M 5.9 -13.1 C 5.8 -14.3, 6.5 -15, 7.2 -14.6 C 7.6 -14.3, 7.6 -13.5, 7.2 -12.9 Z"
                        fill={sq.dark}
                        opacity="0.5"
                      />
                      {/* Ear tip */}
                      <path
                        d="M 5.4 -14 C 5.7 -15.1, 6.6 -15.7, 7.3 -15.3"
                        fill="none"
                        stroke={sq.dark}
                        strokeWidth="0.6"
                        strokeLinecap="round"
                        opacity="0.55"
                      />
                      <circle cx="12" cy="-9.5" r="0.52" fill="#3a2415" />
                      {/* Mouth */}
                      <path
                        d="M 11.8 -8.9 Q 11.3 -8.3 10.6 -8.2"
                        fill="none"
                        stroke="#3a2415"
                        strokeWidth="0.28"
                        strokeLinecap="round"
                        opacity="0.65"
                      />
                      {/* Blinking eye */}
                      <g className="sq-blink">
                        <circle cx="8.3" cy="-11" r="0.68" fill="#2a1a10" />
                        <circle
                          cx="8.54"
                          cy="-11.26"
                          r="0.23"
                          fill="#ffffff"
                          opacity="0.9"
                        />
                      </g>
                      {/* Whiskers */}
                      <path
                        d="M 10.2 -8.2 L 13.2 -7.5 M 10.2 -8.5 L 13.5 -8.7 M 10.2 -8.8 L 13 -9.9"
                        fill="none"
                        stroke="#d8d0c8"
                        strokeWidth="0.18"
                        strokeLinecap="round"
                        opacity="0.55"
                      />

                      {/* Near-side legs */}
                      <g className="sq-leg-a">
                        <path
                          d="M 4.6 -5.2 L 3.9 -2.4 L 5.2 -0.2"
                          fill="none"
                          stroke={sq.dark}
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                      <g className="sq-leg-b">
                        <path
                          d="M -5.8 -5.6 L -7 -2.6 L -4.6 -0.2"
                          fill="none"
                          stroke={sq.dark}
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </g>
                  </g>

                  {/* Weather tint */}
                  {sq.overlay !== "transparent" && (
                    <ellipse
                      cx="-4"
                      cy="-9"
                      rx="13"
                      ry="11"
                      fill={sq.overlay}
                    />
                  )}
                </g>
              </g>
            </g>
          ) : (
            /* Night: sleeping curled up by its burrow at the tree base */
            <g transform="scale(2.8)">
              <g transform="translate(112, 271) scale(1.25)">
                {/* Burrow mound with entrance hole */}
                <g transform="translate(-19, 0)">
                  <path
                    d="M -9 0 Q -5 -4.5 0 -5 Q 5 -4.5 9 0 Z"
                    fill={rootColor}
                  />
                  <ellipse cx="0" cy="-1" rx="3" ry="1.8" fill="#140c06" />
                  <circle
                    cx="-6.5"
                    cy="-0.6"
                    r="0.5"
                    fill={textureColor}
                    opacity="0.7"
                  />
                  <circle
                    cx="6.2"
                    cy="-0.5"
                    r="0.4"
                    fill={textureColor}
                    opacity="0.7"
                  />
                  <circle
                    cx="3.5"
                    cy="-4.2"
                    r="0.35"
                    fill={textureColor}
                    opacity="0.5"
                  />
                </g>

                {/* Curled-up sleeping squirrel, breathing gently */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="1;1.03;1"
                    dur="4s"
                    repeatCount="indefinite"
                    additive="sum"
                  />
                  {/* Ground shadow */}
                  <ellipse
                    cx="0"
                    cy="-0.2"
                    rx="7.5"
                    ry="1.1"
                    fill="#000000"
                    opacity="0.3"
                  />
                  {/* Tail plume — lighter than the body so it reads at night */}
                  <path
                    d="M -5.5 -1.5 C -8 -1, -9 -4, -8.4 -7 C -7.6 -10.4, -3.6 -12, 0.8 -11.3 C 4 -10.7, 5.6 -8.8, 5 -6.4 C 4.5 -4.4, 2.8 -3.2, 0.6 -3 C -1.8 -2.8, -4 -2.2, -5.5 -1.5 Z"
                    fill={sq.tailHighlight}
                  />
                  <path
                    d="M -7.2 -6 C -6 -8.4, -3.2 -9.8, -0.4 -9.6"
                    fill="none"
                    stroke={sq.tail}
                    strokeWidth="1"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <path
                    d="M -4 -10.6 C -1.2 -10.9, 1.8 -10, 3.6 -8.4"
                    fill="none"
                    stroke={sq.tail}
                    strokeWidth="0.9"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  {/* Curled body */}
                  <ellipse cx="0" cy="-3.8" rx="5.6" ry="4.2" fill={sq.body} />
                  <ellipse
                    cx="0.5"
                    cy="-3.3"
                    rx="3.6"
                    ry="2.7"
                    fill={sq.belly}
                    opacity="0.35"
                  />
                  {/* Hind foot poking out */}
                  <ellipse
                    cx="-1.2"
                    cy="-0.6"
                    rx="1.9"
                    ry="0.85"
                    fill={sq.dark}
                  />
                  {/* Head tucked in, light face patch, eyes closed */}
                  <circle cx="3.6" cy="-3.2" r="2.6" fill={sq.body} />
                  <ellipse
                    cx="4.6"
                    cy="-2.6"
                    rx="1.5"
                    ry="1.1"
                    fill={sq.belly}
                    opacity="0.55"
                  />
                  <path
                    d="M 2 -5.2 C 1.6 -6.8, 2.6 -7.6, 3.6 -7.2 C 4.3 -6.8, 4.3 -5.8, 3.8 -5.2 Z"
                    fill={sq.dark}
                  />
                  <path
                    d="M 3.1 -3.4 Q 3.9 -2.8 4.7 -3.4"
                    fill="none"
                    stroke="#2a1a10"
                    strokeWidth="0.38"
                    strokeLinecap="round"
                  />
                  <circle cx="6.2" cy="-2.4" r="0.4" fill="#3a2415" />
                </g>

                {/* Zzz animation */}
                <text
                  x="6"
                  y="-13"
                  fill="#c9a84c"
                  fontSize="4.5"
                  fontFamily="sans-serif"
                  opacity="0.7"
                >
                  z
                  <animate
                    attributeName="opacity"
                    values="0;0.7;0"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="0s"
                  />
                  <animate
                    attributeName="y"
                    values="-13;-19;-25"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="0s"
                  />
                </text>
                <text
                  x="10"
                  y="-11"
                  fill="#c9a84c"
                  fontSize="3.5"
                  fontFamily="sans-serif"
                  opacity="0.5"
                >
                  z
                  <animate
                    attributeName="opacity"
                    values="0;0.5;0"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="1s"
                  />
                  <animate
                    attributeName="y"
                    values="-11;-17;-23"
                    dur="3s"
                    repeatCount="indefinite"
                    begin="1s"
                  />
                </text>
              </g>
            </g>
          )}
        </g>

        <g className="tree-fireflies">
          <g className="ff-d1">
            <circle cx="280" cy="420" r="3" fill={fireflyColor} opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
          <g className="ff-d2">
            <circle cx="520" cy="400" r="2.5" fill={fireflyColor} opacity="0.5">
              <animate
                attributeName="opacity"
                values="0.5;0.9;0.5"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
          <g className="ff-d3">
            <circle cx="320" cy="280" r="2" fill={fireflyColor} opacity="0.4">
              <animate
                attributeName="opacity"
                values="0.2;0.7;0.2"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
          <g className="ff-d1">
            <circle cx="480" cy="260" r="3" fill={fireflyColor} opacity="0.5">
              <animate
                attributeName="opacity"
                values="0.4;0.8;0.4"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
          <g className="ff-d2">
            <circle cx="400" cy="200" r="2.5" fill={fireflyColor} opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.3;0.9;0.3"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
          <g className="ff-d3">
            <circle cx="350" cy="350" r="2" fill={fireflyColor} opacity="0.4">
              <animate
                attributeName="opacity"
                values="0.5;0.8;0.5"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
          <g className="ff-d1">
            <circle cx="450" cy="330" r="2.5" fill={fireflyColor} opacity="0.5">
              <animate
                attributeName="opacity"
                values="0.3;0.7;0.3"
                dur="2.8s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </g>

        {/* Falling leaves (autumn) / petals (spring) */}
        {(season === "autumn" || season === "spring") && (
          <g className="tree-leaves">
            {[300, 360, 420, 470, 340, 500].map((lx, i) => (
              <g
                key={i}
                className="leaf-fall"
                style={
                  {
                    "--lx": `${lx}px`,
                    "--ld": `${9 + i * 1.3}s`,
                    "--ldel": `${-i * 2.7}s`,
                  } as CSSProperties
                }
              >
                <path
                  d="M 0 0 C 2 -3, 5 -3, 6 0 C 5 3, 2 3, 0 0 Z"
                  fill={leafColors[i % leafColors.length]}
                  opacity="0.85"
                  transform={`rotate(${i * 37} 3 0)`}
                />
              </g>
            ))}
          </g>
        )}

        {/* Butterfly on clear spring/summer days */}
        {isDay &&
          (season === "spring" || season === "summer") &&
          weatherType === "clear" && (
            <g className="bf-path">
              <ellipse cx="0" cy="0" rx="0.9" ry="3" fill="#3a2e22" />
              <g className="bf-wing bf-wing-l">
                <ellipse
                  cx="-2.4"
                  cy="-1.2"
                  rx="2.6"
                  ry="3.4"
                  transform="rotate(-18 -2.4 -1.2)"
                  fill="#e8a040"
                />
                <ellipse
                  cx="-2.4"
                  cy="1"
                  rx="1.7"
                  ry="2"
                  transform="rotate(-14 -2.4 1)"
                  fill="#d88030"
                />
              </g>
              <g className="bf-wing bf-wing-r">
                <ellipse
                  cx="2.4"
                  cy="-1.2"
                  rx="2.6"
                  ry="3.4"
                  transform="rotate(18 2.4 -1.2)"
                  fill="#e8a040"
                />
                <ellipse
                  cx="2.4"
                  cy="1"
                  rx="1.7"
                  ry="2"
                  transform="rotate(14 2.4 1)"
                  fill="#d88030"
                />
              </g>
              <path
                d="M -0.6 -3.2 Q -1.6 -5.2 -2.8 -5.8 M 0.6 -3.2 Q 1.6 -5.2 2.8 -5.8"
                stroke="#3a2e22"
                strokeWidth="0.3"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )}

        {/* Bird visits a branch on fair days */}
        {isDay &&
          weatherType !== "rain" &&
          weatherType !== "thunderstorm" &&
          weatherType !== "snow" && (
            <g className="bird-flight">
              <path
                d="M -4.8 -0.8 L -9 -2.2 L -8.2 0 L -9 1 L -4.5 0.8 Z"
                fill="#2a2018"
              />
              <ellipse cx="0" cy="0" rx="5" ry="3.2" fill="#3a2e22" />
              <ellipse
                cx="0.5"
                cy="0.8"
                rx="3.2"
                ry="2"
                fill="#c8b8a0"
                opacity="0.8"
              />
              <g className="bird-fold-wing">
                <ellipse
                  cx="-0.5"
                  cy="-1"
                  rx="3.4"
                  ry="1.8"
                  transform="rotate(-15 -0.5 -1)"
                  fill="#2a2018"
                />
              </g>
              <g className="bird-fly-wing">
                <path
                  d="M -1 -1.5 C -4 -7, -1 -10, 2 -9 C 1 -6, 1 -3, 0.5 -1.5 Z"
                  fill="#2a2018"
                />
              </g>
              <circle cx="4.5" cy="-2.5" r="2.4" fill="#3a2e22" />
              <circle cx="5.2" cy="-2.9" r="0.35" fill="#e8e0d0" />
              <path d="M 6.6 -2.6 L 8.4 -2.1 L 6.6 -1.7 Z" fill="#d8a040" />
            </g>
          )}
      </svg>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: vignette }}
      />

      <style>{`
        .tree-foliage {
          animation: treeSway 6s ease-in-out infinite;
          transform-origin: 400px 750px;
        }
        @keyframes treeSway {
          0%, 100% { transform: rotate(-0.5deg); }
          50% { transform: rotate(0.5deg); }
        }

        /*
         * Barbary Ground Squirrel Animation Script
         * Cycle: 66s — three 22s routines in sequence.
         * Sit-up pose and quadruped walk pose crossfade at transitions.
         * R1 0-33%   FORAGE@TREE  walk to the tree, nibble, walk home
         * R2 33-67%  GROOM        sit, wash face with paws, fluff, scan
         * R3 67-100% EXPLORE      hop-turn, walk left, forage, return
         */
        @keyframes sqPos {
          0%,
          9.83% {
            transform: translate(100px, 271px);
          }
          12.5%,
          19.17% {
            transform: translate(128px, 271px);
            animation-timing-function: ease-out;
          }
          19.28% {
            transform: translate(128px, 268.8px);
            animation-timing-function: ease-in;
          }
          19.4%,
          19.83% {
            transform: translate(128px, 271px);
          }
          21.83%,
          22.27% {
            transform: translate(100px, 271px);
            animation-timing-function: ease-out;
          }
          22.38% {
            transform: translate(100px, 268.8px);
            animation-timing-function: ease-in;
          }
          22.5%,
          68.5% {
            transform: translate(100px, 271px);
            animation-timing-function: ease-out;
          }
          68.93% {
            transform: translate(100px, 268.8px);
            animation-timing-function: ease-in;
          }
          69.07%,
          69.5% {
            transform: translate(100px, 271px);
          }
          72.33%,
          80% {
            transform: translate(76px, 271px);
            animation-timing-function: ease-out;
          }
          80.4% {
            transform: translate(76px, 268.8px);
            animation-timing-function: ease-in;
          }
          80.6%,
          81.17% {
            transform: translate(76px, 271px);
          }
          84%,
          100% {
            transform: translate(100px, 271px);
          }
        }
        @keyframes sqFace {
          0%,
          19.23% {
            transform: scaleX(1);
          }
          19.33%,
          22.33% {
            transform: scaleX(-1);
          }
          22.43%,
          68.73% {
            transform: scaleX(1);
          }
          68.83%,
          80.47% {
            transform: scaleX(-1);
          }
          80.57%,
          100% {
            transform: scaleX(1);
          }
        }
        @keyframes sqSquash {
          0%,
          18.93% {
            transform: scale(1, 1);
          }
          19.07% {
            transform: scale(1.05, 0.9);
          }
          19.28% {
            transform: scale(0.96, 1.06);
          }
          19.4% {
            transform: scale(1.05, 0.9);
          }
          19.6%,
          22.1% {
            transform: scale(1, 1);
          }
          22.23% {
            transform: scale(1.05, 0.9);
          }
          22.38% {
            transform: scale(0.96, 1.06);
          }
          22.5% {
            transform: scale(1.05, 0.9);
          }
          22.73%,
          51.33% {
            transform: scale(1, 1);
          }
          51.67% {
            transform: scale(1.03, 0.96);
          }
          52% {
            transform: scale(0.98, 1.03);
          }
          52.33% {
            transform: scale(1.02, 0.98);
          }
          52.67%,
          68.33% {
            transform: scale(1, 1);
          }
          68.43% {
            transform: scale(1.05, 0.9);
          }
          68.77% {
            transform: scale(0.96, 1.06);
          }
          68.93% {
            transform: scale(1.05, 0.9);
          }
          69.13%,
          80% {
            transform: scale(1, 1);
          }
          80.1% {
            transform: scale(1.05, 0.9);
          }
          80.4% {
            transform: scale(0.96, 1.06);
          }
          80.6% {
            transform: scale(1.05, 0.9);
          }
          80.83%,
          100% {
            transform: scale(1, 1);
          }
        }
        @keyframes sqTilt {
          0%,
          13% {
            transform: rotate(0deg);
          }
          14.17%,
          18.33% {
            transform: rotate(28deg);
          }
          18.67% {
            transform: rotate(-7deg);
          }
          19.17%,
          36% {
            transform: rotate(0deg);
          }
          37%,
          49.33% {
            transform: rotate(8deg);
          }
          50.33%,
          73.17% {
            transform: rotate(0deg);
          }
          74.17%,
          79.5% {
            transform: rotate(28deg);
          }
          79.83% {
            transform: rotate(-7deg);
          }
          80.17%,
          100% {
            transform: rotate(0deg);
          }
        }
        @keyframes sqHead {
          0% {
            transform: rotate(0deg);
          }
          1.33%,
          3% {
            transform: rotate(-14deg);
          }
          4.33%,
          6% {
            transform: rotate(10deg);
          }
          7.33% {
            transform: rotate(0deg);
          }
          8.67% {
            transform: rotate(-8deg);
          }
          9.67% {
            transform: rotate(0deg);
          }
          10.67%,
          12.67% {
            transform: rotate(-8deg);
          }
          14%,
          15.33%,
          16.67%,
          18% {
            transform: rotate(16deg);
          }
          14.67%,
          16%,
          17.33% {
            transform: rotate(30deg);
          }
          18.5%,
          19.17% {
            transform: rotate(-16deg);
          }
          19.67% {
            transform: rotate(-6deg);
          }
          20.67%,
          22% {
            transform: rotate(-8deg);
          }
          22.67% {
            transform: rotate(0deg);
          }
          24.67%,
          26.33% {
            transform: rotate(12deg);
          }
          28%,
          29.67% {
            transform: rotate(-12deg);
          }
          31% {
            transform: rotate(5deg);
          }
          32%,
          34.67% {
            transform: rotate(0deg);
          }
          35.33%,
          36% {
            transform: rotate(-10deg);
          }
          36.67% {
            transform: rotate(12deg);
          }
          37.33%,
          38.67%,
          40%,
          41.33%,
          42.67%,
          44%,
          45.33% {
            transform: rotate(26deg);
          }
          38%,
          39.33%,
          40.67%,
          42%,
          43.33%,
          44.67% {
            transform: rotate(15deg);
          }
          46.67%,
          48% {
            transform: rotate(-12deg);
          }
          48.67% {
            transform: rotate(14deg);
          }
          49.33% {
            transform: rotate(24deg);
          }
          50% {
            transform: rotate(14deg);
          }
          50.67% {
            transform: rotate(-4deg);
          }
          51% {
            transform: rotate(4deg);
          }
          51.33% {
            transform: rotate(-4deg);
          }
          51.67% {
            transform: rotate(3deg);
          }
          52%,
          53.33% {
            transform: rotate(0deg);
          }
          54.67%,
          56.67% {
            transform: rotate(10deg);
          }
          58%,
          60% {
            transform: rotate(-14deg);
          }
          61.33%,
          63.33% {
            transform: rotate(8deg);
          }
          64.67%,
          67.33% {
            transform: rotate(0deg);
          }
          67.83%,
          68.33% {
            transform: rotate(-12deg);
          }
          68.83%,
          72.17% {
            transform: rotate(-8deg);
          }
          73.33%,
          74.67%,
          76%,
          77.33%,
          78.67% {
            transform: rotate(16deg);
          }
          74%,
          75.33%,
          76.67%,
          78%,
          79% {
            transform: rotate(30deg);
          }
          79.67%,
          80.33% {
            transform: rotate(-16deg);
          }
          80.83%,
          83.67% {
            transform: rotate(-8deg);
          }
          84.33% {
            transform: rotate(0deg);
          }
          86%,
          87.67% {
            transform: rotate(10deg);
          }
          89.33%,
          91% {
            transform: rotate(-10deg);
          }
          92.67%,
          94% {
            transform: rotate(12deg);
          }
          96%,
          97.33% {
            transform: rotate(-8deg);
          }
          98.67%,
          100% {
            transform: rotate(0deg);
          }
        }
        @keyframes sqTailLift {
          0%,
          12.67% {
            transform: rotate(0deg);
          }
          14.67%,
          18% {
            transform: rotate(-6deg);
          }
          18.67% {
            transform: rotate(4deg);
          }
          19.17%,
          36.67% {
            transform: rotate(0deg);
          }
          38%,
          49.33% {
            transform: rotate(-12deg);
          }
          50.67% {
            transform: rotate(-4deg);
          }
          52%,
          72.67% {
            transform: rotate(0deg);
          }
          74.33%,
          79% {
            transform: rotate(-6deg);
          }
          79.83% {
            transform: rotate(4deg);
          }
          80.17%,
          100% {
            transform: rotate(0deg);
          }
        }
        @keyframes sqTailSway {
          0%,
          100% {
            transform: rotate(-4deg);
          }
          50% {
            transform: rotate(6deg);
          }
        }
        @keyframes sqBreathe {
          0%,
          100% {
            transform: scale(1, 1);
          }
          50% {
            transform: scale(1.012, 1.018);
          }
        }
        @keyframes sqEar {
          0%,
          86% {
            transform: rotate(0deg);
          }
          90% {
            transform: rotate(16deg);
          }
          94% {
            transform: rotate(-5deg);
          }
          98%,
          100% {
            transform: rotate(0deg);
          }
        }
        @keyframes sqSitShow {
          0%,
          9.5% {
            opacity: 1;
          }
          9.83%,
          12.5% {
            opacity: 0;
          }
          12.83%,
          19.5% {
            opacity: 1;
          }
          19.83%,
          21.83% {
            opacity: 0;
          }
          22.17%,
          69.17% {
            opacity: 1;
          }
          69.5%,
          72.17% {
            opacity: 0;
          }
          72.5%,
          81% {
            opacity: 1;
          }
          81.33%,
          83.83% {
            opacity: 0;
          }
          84.17%,
          100% {
            opacity: 1;
          }
        }
        @keyframes sqWalkShow {
          0%,
          9.5% {
            opacity: 0;
          }
          9.83%,
          12.5% {
            opacity: 1;
          }
          12.83%,
          19.5% {
            opacity: 0;
          }
          19.83%,
          21.83% {
            opacity: 1;
          }
          22.17%,
          69.17% {
            opacity: 0;
          }
          69.5%,
          72.17% {
            opacity: 1;
          }
          72.5%,
          81% {
            opacity: 0;
          }
          81.33%,
          83.83% {
            opacity: 1;
          }
          84.17%,
          100% {
            opacity: 0;
          }
        }
        @keyframes sqLegSwing {
          0%,
          100% {
            transform: rotate(-16deg);
          }
          50% {
            transform: rotate(16deg);
          }
        }
        @keyframes sqWalkBob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-0.35px);
          }
        }
        .sq-pos {
          animation: sqPos 66s linear infinite;
        }
        .sq-face {
          animation: sqFace 66s linear infinite;
          transform-box: fill-box;
          transform-origin: 50% 50%;
        }
        .sq-sit {
          animation: sqSitShow 66s linear infinite;
        }
        .sq-walk {
          animation: sqWalkShow 66s linear infinite;
        }
        .sq-squash {
          animation: sqSquash 66s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 50% 100%;
        }
        .sq-tilt {
          animation: sqTilt 66s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 50% 100%;
        }
        .sq-head {
          animation: sqHead 66s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 22% 95%;
        }
        .sq-tail-lift {
          animation: sqTailLift 66s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 92% 95%;
        }
        .sq-tail-sway {
          animation: sqTailSway 2.6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 92% 95%;
        }
        .sq-breathe {
          animation: sqBreathe 3.2s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 50% 100%;
        }
        .sq-ear {
          animation: sqEar 4.4s linear infinite;
          transform-box: fill-box;
          transform-origin: 50% 100%;
        }
        .sq-walk-bob {
          animation: sqWalkBob 0.22s ease-in-out infinite;
        }
        .sq-walk-tail {
          animation: sqTailSway 1.4s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 95% 92%;
        }
        .sq-leg-a {
          animation: sqLegSwing 0.44s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 50% 0%;
        }
        .sq-leg-b {
          animation: sqLegSwing 0.44s ease-in-out infinite;
          animation-delay: -0.22s;
          transform-box: fill-box;
          transform-origin: 50% 0%;
        }
        @keyframes sqBlink {
          0%,
          91% {
            transform: scaleY(1);
          }
          93.5% {
            transform: scaleY(0.08);
          }
          96%,
          100% {
            transform: scaleY(1);
          }
        }
        .sq-blink {
          animation: sqBlink 4.7s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 50% 50%;
        }

        /* ─── Scene ambience ─── */

        /* Occasional wind gusts on top of the base foliage sway */
        .tree-gust {
          animation: treeGust 17s ease-in-out infinite;
          transform-origin: 400px 750px;
        }
        @keyframes treeGust {
          0%,
          26% {
            transform: rotate(0deg);
          }
          30% {
            transform: rotate(1.6deg);
          }
          34% {
            transform: rotate(0.4deg);
          }
          38%,
          68% {
            transform: rotate(0deg);
          }
          72% {
            transform: rotate(-1.2deg);
          }
          76% {
            transform: rotate(0.5deg);
          }
          80%,
          100% {
            transform: rotate(0deg);
          }
        }

        /* Fireflies drift slowly instead of hovering in place */
        .ff-d1 {
          animation: ffDrift1 11s ease-in-out infinite;
        }
        .ff-d2 {
          animation: ffDrift2 13s ease-in-out infinite;
        }
        .ff-d3 {
          animation: ffDrift3 9s ease-in-out infinite;
        }
        @keyframes ffDrift1 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(14px, -18px);
          }
          66% {
            transform: translate(-10px, -8px);
          }
        }
        @keyframes ffDrift2 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          40% {
            transform: translate(-16px, 10px);
          }
          70% {
            transform: translate(8px, 16px);
          }
        }
        @keyframes ffDrift3 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(12px, 14px);
          }
        }

        /* Falling leaves / petals — start x, duration and delay per leaf */
        .leaf-fall {
          animation: leafFall var(--ld, 11s) linear infinite;
          animation-delay: var(--ldel, 0s);
        }
        @keyframes leafFall {
          0% {
            transform: translate(var(--lx), 280px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.85;
          }
          35% {
            transform: translate(calc(var(--lx) - 24px), 440px) rotate(140deg);
          }
          65% {
            transform: translate(calc(var(--lx) + 14px), 610px) rotate(250deg);
          }
          90% {
            opacity: 0.85;
          }
          100% {
            transform: translate(calc(var(--lx) - 8px), 748px) rotate(360deg);
            opacity: 0;
          }
        }

        /* Butterfly lazily circling the canopy */
        .bf-path {
          animation: bfPath 26s ease-in-out infinite;
        }
        @keyframes bfPath {
          0%,
          100% {
            transform: translate(280px, 420px) rotate(8deg);
          }
          18% {
            transform: translate(350px, 340px) rotate(-6deg);
          }
          38% {
            transform: translate(470px, 300px) rotate(10deg);
          }
          55% {
            transform: translate(520px, 390px) rotate(-8deg);
          }
          72% {
            transform: translate(430px, 450px) rotate(6deg);
          }
          88% {
            transform: translate(330px, 460px) rotate(-4deg);
          }
        }
        .bf-wing-l {
          animation: bfFlap 0.36s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 100% 50%;
        }
        .bf-wing-r {
          animation: bfFlap 0.36s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 0% 50%;
        }
        @keyframes bfFlap {
          0%,
          100% {
            transform: scaleX(1);
          }
          50% {
            transform: scaleX(0.3);
          }
        }

        /* Bird flies in, perches on the branch, then leaves — 30s cycle */
        .bird-flight {
          animation: birdFlight 30s ease-in-out infinite;
        }
        @keyframes birdFlight {
          0%,
          67% {
            transform: translate(-80px, 380px);
            opacity: 0;
          }
          69% {
            opacity: 1;
          }
          72% {
            transform: translate(140px, 430px);
          }
          76% {
            transform: translate(310px, 474px);
          }
          79% {
            transform: translate(310px, 472.2px);
          }
          81% {
            transform: translate(310px, 474px);
          }
          83% {
            transform: translate(310px, 472.6px);
          }
          86% {
            transform: translate(310px, 474px);
            opacity: 1;
          }
          90% {
            transform: translate(560px, 380px);
          }
          94% {
            transform: translate(880px, 320px);
            opacity: 1;
          }
          95%,
          100% {
            transform: translate(880px, 320px);
            opacity: 0;
          }
        }
        .bird-fly-wing {
          animation:
            birdWingFlap 0.28s ease-in-out infinite,
            birdFlyShow 30s linear infinite;
          transform-box: fill-box;
          transform-origin: 60% 90%;
        }
        @keyframes birdWingFlap {
          0%,
          100% {
            transform: rotate(-25deg);
          }
          50% {
            transform: rotate(30deg);
          }
        }
        @keyframes birdFlyShow {
          0%,
          67.5% {
            opacity: 0;
          }
          68.5%,
          76.5% {
            opacity: 1;
          }
          77.5%,
          85.5% {
            opacity: 0;
          }
          86.5%,
          94% {
            opacity: 1;
          }
          95%,
          100% {
            opacity: 0;
          }
        }
        .bird-fold-wing {
          animation: birdFoldShow 30s linear infinite;
        }
        @keyframes birdFoldShow {
          0%,
          76.5% {
            opacity: 0;
          }
          77.5%,
          85.5% {
            opacity: 1;
          }
          86.5%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function Particles({
  isLight,
  weatherType,
}: {
  isLight: boolean;
  weatherType: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;
    }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Adjust particle count and behavior based on weather
    const count =
      weatherType === "clear" ? 20 : weatherType === "cloudy" ? 35 : 25;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.5 - 0.2,
        opacity: Math.random() * 0.5 + 0.1,
        fadeSpeed: Math.random() * 0.005 + 0.002,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(Date.now() * p.fadeSpeed) * 0.01;
        p.opacity = Math.max(0.05, Math.min(0.6, p.opacity));

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        // Particle color based on weather
        if (weatherType === "snow") {
          ctx.fillStyle = `rgba(220, 235, 255, ${p.opacity})`;
        } else if (weatherType === "rain") {
          ctx.fillStyle = `rgba(140, 160, 180, ${p.opacity})`;
        } else if (weatherType === "thunderstorm") {
          ctx.fillStyle = `rgba(120, 130, 150, ${p.opacity})`;
        } else {
          ctx.fillStyle = isLight
            ? `rgba(90, 140, 70, ${p.opacity})`
            : `rgba(107, 143, 78, ${p.opacity})`;
        }
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [isLight, weatherType]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7, zIndex: 1 }}
    />
  );
}
