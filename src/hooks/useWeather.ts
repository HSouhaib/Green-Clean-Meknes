import { useState, useEffect, useCallback } from 'react';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunderstorm';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export interface WeatherData {
  temperature: number;
  windspeed: number;
  winddirection: number;
  humidity: number;
  isDay: boolean;
  weatherCode: number;
  weatherType: WeatherType;
  season: Season;
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

const CACHE_KEY = 'meknes_weather_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const STALE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (use stale data if API fails)

const MEKNES_LAT = 33.8933;
const MEKNES_LNG = -5.5582;

function getWeatherType(code: number): WeatherType {
  if (code <= 1) return 'clear';
  if (code === 2) return 'cloudy';
  if (code === 3 || (code >= 45 && code <= 48)) return 'cloudy';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 95) return 'thunderstorm';
  return 'clear';
}

function getSeason(): Season {
  const month = new Date().getMonth(); // 0-11
  if (month <= 1 || month === 11) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

function getDefaultWeather(): WeatherData {
  return {
    temperature: 28,
    windspeed: 8,
    winddirection: 180,
    humidity: 45,
    isDay: true,
    weatherCode: 0,
    weatherType: 'clear',
    season: getSeason(),
  };
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData>(getDefaultWeather());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedWeather = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        
        // Use cache if fresh (< 10 min)
        if (age < CACHE_DURATION) {
          setWeather(parsed.data);
          setLoading(false);
          setError(null);
          return;
        }
        
        // Use stale cache immediately while fetching in background
        if (age < STALE_CACHE_DURATION) {
          setWeather(parsed.data);
          setLoading(false);
        }
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${MEKNES_LAT}&longitude=${MEKNES_LNG}&current=relative_humidity_2m,temperature,windspeed,winddirection,is_day,weathercode`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.current) {
        throw new Error('Invalid weather data format');
      }

      const weatherData: WeatherData = {
        temperature: data.current.temperature,
        windspeed: data.current.windspeed,
        winddirection: data.current.winddirection,
        humidity: data.current.relative_humidity_2m ?? 0,
        isDay: data.current.is_day === 1,
        weatherCode: data.current.weathercode,
        weatherType: getWeatherType(data.current.weathercode),
        season: getSeason(),
      };

      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: weatherData,
        timestamp: Date.now(),
      }));

      setWeather(weatherData);
      setLoading(false);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(message);
      setLoading(false);
      
      // Try to use stale cache as fallback
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed: CachedWeather = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < STALE_CACHE_DURATION) {
            setWeather(parsed.data);
          }
        } catch {
          // Invalid cache, keep default
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    
    // Poll every 10 minutes
    const interval = setInterval(fetchWeather, CACHE_DURATION);
    
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Dispatch day/night updates for theme auto mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('weather-daynight', {
        detail: { isDay: weather.isDay }
      }));
    }
  }, [weather.isDay]);

  return { weather, loading, error, refetch: fetchWeather };
}

export function getWeatherIcon(type: WeatherType, isDay: boolean): string {
  // At night, show moon for clear/cloudy, keep rain/snow/storm icons
  if (!isDay) {
    switch (type) {
      case 'clear': return '🌙';
      case 'cloudy': return '☁️';
      case 'rain': return '🌧️';
      case 'snow': return '❄️';
      case 'thunderstorm': return '⛈️';
      default: return '🌙';
    }
  }
  switch (type) {
    case 'clear': return '☀️';
    case 'cloudy': return '☁️';
    case 'rain': return '🌧️';
    case 'snow': return '❄️';
    case 'thunderstorm': return '⛈️';
    default: return '☀️';
  }
}

/** Returns a translation key for the weather condition, e.g. 'weather.clear_day' */
export function getWeatherTranslationKey(type: WeatherType, isDay: boolean): string {
  switch (type) {
    case 'clear': return isDay ? 'weather.clear_day' : 'weather.clear_night';
    case 'cloudy': return 'weather.cloudy';
    case 'rain': return 'weather.rain';
    case 'snow': return 'weather.snow';
    case 'thunderstorm': return 'weather.thunderstorm';
    default: return 'weather.clear_day';
  }
}
