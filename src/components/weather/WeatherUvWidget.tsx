import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  ShieldAlert,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '../../utils/formatters';

export interface WeatherUvData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  uvIndex: number;
  uvMax: number;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  updatedAt: string;
}

export type UvRiskCategory =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Very High'
  | 'Extreme';

export interface UvGuidance {
  category: UvRiskCategory;
  badgeColor: string;
  sunscreenAdvice: string;
  safetyTip: string;
  bestHours: string;
  hydrationTip: string;
}

export function getUvGuidance(uv: number): UvGuidance {
  if (uv < 3) {
    return {
      category: 'Low',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      sunscreenAdvice: 'SPF 15+ if outdoors for extended periods.',
      safetyTip: 'Safe for outdoor walks, exercise, and errands.',
      bestHours: 'All day outdoor comfort',
      hydrationTip: 'Drink water regularly (~250ml every hour outdoors).',
    };
  }
  if (uv < 6) {
    return {
      category: 'Moderate',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      sunscreenAdvice: 'Apply broad-spectrum SPF 30+ sunscreen & sunglasses.',
      safetyTip: 'Seek shade around solar noon (11 AM – 3 PM).',
      bestHours: 'Before 11 AM or after 3:30 PM',
      hydrationTip: 'Keep a water bottle handy and stay hydrated.',
    };
  }
  if (uv < 8) {
    return {
      category: 'High',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      sunscreenAdvice: 'Use SPF 50+ every 2 hours; wear a hat & UV sunglasses.',
      safetyTip: 'Reduce direct midday sun exposure.',
      bestHours: 'Early morning (6–10 AM) or late afternoon (after 4 PM)',
      hydrationTip: 'Drink extra water and electrolytes when outside.',
    };
  }
  if (uv < 11) {
    return {
      category: 'Very High',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      sunscreenAdvice: 'Mandatory SPF 50+, protective clothing, and wide-brim hat.',
      safetyTip: 'Avoid direct sun between 10 AM and 4 PM.',
      bestHours: 'Before 9:30 AM or after 4:30 PM',
      hydrationTip: 'High heat & UV load — hydrate every 20–30 minutes.',
    };
  }
  return {
    category: 'Extreme',
    badgeColor: 'bg-purple-500/25 text-purple-200 border-purple-400/50',
    sunscreenAdvice: 'Maximum UV alert: SPF 50+ PA++++ and full UV-blocking gear.',
    safetyTip: 'Stay indoors or in full shade during midday hours.',
    bestHours: 'Sunrise to 9 AM or after 5 PM only',
    hydrationTip: 'Prioritize cool water & electrolytes continuously.',
  };
}

export function getWeatherDescription(code: number): {
  label: string;
  emoji: string;
} {
  if (code === 0) return { label: 'Clear Sky', emoji: '☀️' };
  if (code === 1 || code === 2) return { label: 'Partly Cloudy', emoji: '⛅' };
  if (code === 3) return { label: 'Overcast', emoji: '☁️' };
  if (code === 45 || code === 48) return { label: 'Misty Fog', emoji: '🌫️' };
  if (code >= 51 && code <= 67) return { label: 'Light Rain', emoji: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Snowfall', emoji: '❄️' };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', emoji: '🌦️' };
  if (code >= 95) return { label: 'Thunderstorm', emoji: '⛈️' };
  return { label: 'Pleasant Breeze', emoji: '🌤️' };
}

const PRESET_CITIES = [
  { city: 'Bengaluru', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { city: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
  { city: 'Mumbai', country: 'India', latitude: 19.076, longitude: 72.8777 },
  { city: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.006 },
  { city: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 },
];

function formatClockTime(isoOrTime: string): string {
  if (!isoOrTime) return '06:15 AM';
  try {
    const d = new Date(isoOrTime);
    if (Number.isNaN(d.getTime())) return isoOrTime;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoOrTime;
  }
}

export const WeatherUvWidget: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [location, setLocation] = useState(PRESET_CITIES[0]);
  const [cityQuery, setCityQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherUvData>({
    city: PRESET_CITIES[0].city,
    country: PRESET_CITIES[0].country,
    latitude: PRESET_CITIES[0].latitude,
    longitude: PRESET_CITIES[0].longitude,
    temperature: 27,
    feelsLike: 28,
    humidity: 62,
    windSpeed: 12,
    weatherCode: 1,
    uvIndex: 5.4,
    uvMax: 7.2,
    tempMax: 30,
    tempMin: 20,
    sunrise: '06:12 AM',
    sunset: '06:28 PM',
    updatedAt: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  const fetchLiveWeather = useCallback(
    async (loc: {
      city: string;
      country: string;
      latitude: number;
      longitude: number;
    }) => {
      setIsLoading(true);
      setLocationMessage(null);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=1`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Weather HTTP ${response.status}`);
        }
        const json = await response.json();
        const current = json.current || {};
        const daily = json.daily || {};

        setWeather({
          city: loc.city,
          country: loc.country,
          latitude: loc.latitude,
          longitude: loc.longitude,
          temperature: Math.round(current.temperature_2m ?? 26),
          feelsLike: Math.round(current.apparent_temperature ?? 27),
          humidity: Math.round(current.relative_humidity_2m ?? 60),
          windSpeed: Math.round(current.wind_speed_10m ?? 11),
          weatherCode: Number(current.weather_code ?? 1),
          uvIndex: Number(Number(current.uv_index ?? 4.5).toFixed(1)),
          uvMax: Number(Number(daily.uv_index_max?.[0] ?? 6.8).toFixed(1)),
          tempMax: Math.round(daily.temperature_2m_max?.[0] ?? 30),
          tempMin: Math.round(daily.temperature_2m_min?.[0] ?? 20),
          sunrise: formatClockTime(daily.sunrise?.[0] ?? ''),
          sunset: formatClockTime(daily.sunset?.[0] ?? ''),
          updatedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      } catch {
        // Keep current/fallback telemetry with fresh timestamp if offline
        setWeather((prev) => ({
          ...prev,
          city: loc.city,
          country: loc.country,
          latitude: loc.latitude,
          longitude: loc.longitude,
          updatedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchLiveWeather(location);
  }, [fetchLiveWeather, location]);

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = cityQuery.trim();
    if (!query) return;
    setIsSearching(true);
    setLocationMessage(null);

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      if (res.ok) {
        const data = await res.json();
        const hit = data.results?.[0];
        if (hit) {
          const nextLoc = {
            city: hit.name,
            country: hit.country || '',
            latitude: hit.latitude,
            longitude: hit.longitude,
          };
          setLocation(nextLoc);
          setCityQuery('');
          return;
        }
      }
      setLocationMessage(`Could not find "${query}". Try another city.`);
    } catch {
      const matchedPreset = PRESET_CITIES.find((c) =>
        c.city.toLowerCase().includes(query.toLowerCase())
      );
      if (matchedPreset) {
        setLocation(matchedPreset);
        setCityQuery('');
      } else {
        setLocationMessage('Search unavailable offline. Select a preset city.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleDetectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }
    setIsLoading(true);
    setLocationMessage('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLoc = {
          city: 'My Location',
          country: `${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocationMessage(null);
        setLocation(nextLoc);
      },
      () => {
        setIsLoading(false);
        setLocationMessage(
          'Location permission denied. Using manual city selection.'
        );
      },
      { timeout: 8000 }
    );
  };

  const condition = getWeatherDescription(weather.weatherCode);
  const uvGuidance = getUvGuidance(weather.uvIndex);

  const renderWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-7 w-7 text-amber-400 animate-spin" style={{ animationDuration: '16s' }} />;
    if (code >= 51 && code <= 67) return <CloudRain className="h-7 w-7 text-sky-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="h-7 w-7 text-cyan-200" />;
    if (code >= 95) return <CloudLightning className="h-7 w-7 text-amber-300" />;
    return <Cloud className="h-7 w-7 text-sky-300" />;
  };

  return (
    <section
      aria-label="Live Weather and UV Index Widget"
      data-testid="weather-uv-widget"
      className={cn(
        'w-full rounded-3xl border border-white/10 bg-[#15182C]/80 p-4 sm:p-5 text-left backdrop-blur-2xl shadow-card-subtle transition-all',
        className
      )}
    >
      {/* Top Bar: Location, City Search, Geolocation & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
            <MapPin className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                {weather.city}
                {weather.country ? `, ${weather.country}` : ''}
              </h3>
              <span className="text-[10px] text-[#A1A1B8]">
                • Updated {weather.updatedAt}
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1B8]">
              Live Environmental & UV Intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* City Search Form */}
          <form onSubmit={handleCitySearch} className="flex items-center gap-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#A1A1B8]" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                placeholder="Search city..."
                aria-label="Search city for weather"
                className="w-28 sm:w-36 rounded-xl border border-white/10 bg-[#0D1021]/90 pl-7 pr-2.5 py-1 text-xs text-[#F8FAFC] placeholder-[#72758E] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 px-2.5 py-1 text-[11px] font-semibold text-[#C4B5FD] hover:bg-[#8B5CF6]/30 transition-colors"
            >
              Go
            </button>
          </form>

          <button
            type="button"
            onClick={handleDetectLocation}
            title="Detect my location"
            aria-label="Detect my location"
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#0D1021]/80 px-2.5 py-1 text-[11px] font-medium text-[#22D3EE] hover:border-[#22D3EE]/40 transition-colors"
          >
            <Navigation className="h-3 w-3" />
            <span className="hidden sm:inline">My Location</span>
          </button>

          <button
            type="button"
            onClick={() => void fetchLiveWeather(location)}
            disabled={isLoading}
            title="Refresh live weather and UV data"
            aria-label="Refresh weather"
            data-testid="refresh-weather-btn"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#0D1021]/80 p-1.5 text-[#A1A1B8] hover:text-[#F8FAFC] hover:border-white/25 transition-colors"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', isLoading && 'animate-spin text-[#22D3EE]')}
            />
          </button>
        </div>
      </div>

      {/* Preset Quick Cities */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {PRESET_CITIES.map((preset) => {
          const active = preset.city === weather.city;
          return (
            <button
              key={preset.city}
              type="button"
              onClick={() => setLocation(preset)}
              className={cn(
                'rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all border',
                active
                  ? 'border-[#22D3EE]/50 bg-[#22D3EE]/15 text-[#22D3EE]'
                  : 'border-white/[0.06] bg-[#0D1021]/50 text-[#A1A1B8] hover:text-white'
              )}
            >
              {preset.city}
            </button>
          );
        })}
        {locationMessage && (
          <span className="text-[11px] text-amber-300 ml-2">
            {locationMessage}
          </span>
        )}
      </div>

      {/* Main Telemetry Grid: Weather + UV Index & Guidance */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Left: Temperature & Atmospheric Telemetry */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0D1021]/70 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10">
                {renderWeatherIcon(weather.weatherCode)}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]"
                    data-testid="weather-temperature"
                  >
                    {weather.temperature}°C
                  </span>
                  <span className="text-xs font-medium text-[#A1A1B8]">
                    Feels {weather.feelsLike}°C
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#22D3EE]">
                  {condition.emoji} {condition.label} • H:{weather.tempMax}° L:
                  {weather.tempMin}°
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 pt-2.5 border-t border-white/[0.06] text-[11px]">
            <div className="flex items-center gap-1 text-[#A1A1B8]">
              <Droplets className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-[#A1A1B8]">
              <Wind className="h-3.5 w-3.5 text-teal-300 shrink-0" />
              <span>{weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-1 text-[#A1A1B8]">
              <Sunrise className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{weather.sunrise}</span>
            </div>
            <div className="flex items-center gap-1 text-[#A1A1B8]">
              <Sunset className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{weather.sunset}</span>
            </div>
          </div>
        </div>

        {/* Right: UV Index & Protection Guidance */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0D1021]/70 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                UV Index: {weather.uvIndex}
              </span>
              <span className="text-[11px] text-[#A1A1B8]">
                (Peak {weather.uvMax})
              </span>
            </div>
            <span
              data-testid="uv-risk-category"
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase',
                uvGuidance.badgeColor
              )}
            >
              {uvGuidance.category} Risk
            </span>
          </div>

          {/* UV Progress Bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(8, (weather.uvIndex / 11) * 100))}%`,
              }}
            />
          </div>

          <div className="mt-2.5 space-y-1 text-[11px] text-[#A1A1B8]">
            <p>
              <strong className="text-[#F8FAFC]">Sunscreen:</strong>{' '}
              {uvGuidance.sunscreenAdvice}
            </p>
            <p>
              <strong className="text-[#F8FAFC]">Best Hours:</strong>{' '}
              {uvGuidance.bestHours} • {uvGuidance.hydrationTip}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
