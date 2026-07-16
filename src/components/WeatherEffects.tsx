import { useEffect, useRef } from 'react';
import type { WeatherType } from '@/hooks/useWeather';

interface WeatherEffectsProps {
  weatherType: WeatherType;
  isDay: boolean;
  windSpeed: number;
  temperature: number;
}

export default function WeatherEffects({ weatherType, isDay, windSpeed, temperature }: WeatherEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle systems
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
      maxLife: number;
    }

    const rainDrops: Particle[] = [];
    const snowFlakes: Particle[] = [];
    const clouds: { x: number; y: number; width: number; height: number; speed: number; opacity: number }[] = [];
    const stars: { x: number; y: number; size: number; opacity: number; twinkleSpeed: number; twinkleOffset: number }[] = [];
    let lightningTimer = 0;
    let lightningFlash = 0;

    // Initialize based on weather type
    const initParticles = () => {
      rainDrops.length = 0;
      snowFlakes.length = 0;
      clouds.length = 0;
      stars.length = 0;

      const w = canvas.width;
      const h = canvas.height;

      // Rain
      if (weatherType === 'rain' || weatherType === 'thunderstorm') {
        const count = weatherType === 'thunderstorm' ? 300 : 180;
        for (let i = 0; i < count; i++) {
          rainDrops.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (windSpeed / 20) * (Math.random() * 0.5 + 0.5),
            vy: Math.random() * 4 + 8 + (windSpeed / 10),
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.4 + 0.2,
            life: 0,
            maxLife: 1,
          });
        }
      }

      // Snow
      if (weatherType === 'snow') {
        for (let i = 0; i < 150; i++) {
          snowFlakes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.5 + (windSpeed / 30),
            vy: Math.random() * 1.5 + 0.5,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.3,
            life: 0,
            maxLife: 1,
          });
        }
      }

      // Clouds
      if (weatherType === 'cloudy' || weatherType === 'rain' || weatherType === 'thunderstorm' || weatherType === 'snow') {
        const count = weatherType === 'cloudy' ? 6 : 10;
        for (let i = 0; i < count; i++) {
          clouds.push({
            x: Math.random() * w,
            y: Math.random() * (h * 0.4) + 20,
            width: Math.random() * 120 + 80,
            height: Math.random() * 40 + 30,
            speed: (Math.random() * 0.3 + 0.1) * (windSpeed / 10 + 1),
            opacity: weatherType === 'cloudy' ? 0.25 : 0.4,
          });
        }
      }

      // Stars (night only, and not during heavy weather)
      if (!isDay && (weatherType === 'clear' || weatherType === 'cloudy')) {
        for (let i = 0; i < 120; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * (h * 0.6),
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.6 + 0.2,
            twinkleSpeed: Math.random() * 0.003 + 0.001,
            twinkleOffset: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    initParticles();

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw stars
      if (stars.length > 0) {
        const time = Date.now();
        stars.forEach((star) => {
          const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 240, ${star.opacity * twinkle})`;
          ctx.fill();
        });
      }

      // Draw clouds
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > w + cloud.width) {
          cloud.x = -cloud.width;
          cloud.y = Math.random() * (h * 0.4) + 20;
        }

        ctx.save();
        ctx.globalAlpha = cloud.opacity;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const cloudColor = isLight ? '255, 255, 255' : '180, 190, 200';
        
        // Draw cloud as multiple overlapping ellipses
        ctx.fillStyle = `rgba(${cloudColor}, 0.8)`;
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(cloud.x - cloud.width * 0.3, cloud.y + 5, cloud.width * 0.35, cloud.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(cloud.x + cloud.width * 0.25, cloud.y + 3, cloud.width * 0.3, cloud.height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      // Draw rain
      rainDrops.forEach((drop) => {
        drop.x += drop.vx;
        drop.y += drop.vy;

        if (drop.y > h) {
          drop.y = -10;
          drop.x = Math.random() * w;
        }
        if (drop.x > w + 10) drop.x = -10;
        if (drop.x < -10) drop.x = w + 10;

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.vx * 0.5, drop.y + drop.size * 4);
        ctx.strokeStyle = `rgba(170, 190, 210, ${drop.opacity})`;
        ctx.lineWidth = drop.size;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // Draw snow
      snowFlakes.forEach((flake) => {
        flake.x += flake.vx + Math.sin(Date.now() * 0.001 + flake.y * 0.01) * 0.3;
        flake.y += flake.vy;

        if (flake.y > h) {
          flake.y = -10;
          flake.x = Math.random() * w;
        }
        if (flake.x > w + 10) flake.x = -10;
        if (flake.x < -10) flake.x = w + 10;

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 248, 255, ${flake.opacity})`;
        ctx.fill();
      });

      // Lightning
      if (weatherType === 'thunderstorm') {
        lightningTimer -= 16; // ~60fps
        if (lightningTimer <= 0) {
          lightningTimer = Math.random() * 5000 + 3000; // 3-8 seconds
          lightningFlash = 1;
        }

        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(255, 255, 240, ${lightningFlash * 0.15})`;
          ctx.fillRect(0, 0, w, h);
          
          // Lightning bolt
          if (lightningFlash > 0.7) {
            const startX = Math.random() * w * 0.6 + w * 0.2;
            ctx.strokeStyle = `rgba(255, 255, 220, ${lightningFlash})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            let cx = startX;
            let cy = 0;
            while (cy < h * 0.7) {
              cx += (Math.random() - 0.5) * 40;
              cy += Math.random() * 30 + 20;
              ctx.lineTo(cx, cy);
            }
            ctx.stroke();
          }
          
          lightningFlash -= 0.08;
          if (lightningFlash < 0) lightningFlash = 0;
        }
      }

      // Heat shimmer overlay for hot days
      if (temperature > 30 && isDay && weatherType === 'clear') {
        const shimmer = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
        const gradient = ctx.createLinearGradient(0, h * 0.5, 0, h);
        gradient.addColorStop(0, `rgba(255, 160, 60, 0)`);
        gradient.addColorStop(0.5, `rgba(255, 140, 40, ${0.03 * shimmer})`);
        gradient.addColorStop(1, `rgba(255, 120, 30, ${0.05 * shimmer})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, h * 0.5, w, h * 0.5);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [weatherType, isDay, windSpeed, temperature]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
