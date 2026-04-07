import { useEffect, useState } from "react";

const BEIJING_COORDINATES = {
  latitude: 39.9042,
  longitude: 116.4074,
};

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "晴",
  1: "大部晴朗",
  2: "局部多云",
  3: "阴",
  45: "雾",
  48: "冻雾",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "强毛毛雨",
  56: "冻毛毛雨",
  57: "强冻毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "冻雨",
  67: "强冻雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "冰粒",
  80: "小阵雨",
  81: "阵雨",
  82: "强阵雨",
  85: "小阵雪",
  86: "强阵雪",
  95: "雷阵雨",
  96: "雷阵雨伴小冰雹",
  99: "雷阵雨伴强冰雹",
};

type OpenMeteoCurrentResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
};

function getWeatherLabel(code?: number) {
  if (code === undefined) return "天气 --";
  return WEATHER_CODE_LABELS[code] ?? "天气未知";
}

export function useWeather() {
  const [weatherText, setWeatherText] = useState("天气 --");
  const [temperatureText, setTemperatureText] = useState("--°C");

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async () => {
      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", String(BEIJING_COORDINATES.latitude));
        url.searchParams.set("longitude", String(BEIJING_COORDINATES.longitude));
        url.searchParams.set("current", "temperature_2m,weather_code");
        url.searchParams.set("timezone", "Asia/Shanghai");

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`天气请求失败 (${response.status})`);
        }

        const payload = (await response.json()) as OpenMeteoCurrentResponse;
        if (cancelled) return;

        const temperature = payload.current?.temperature_2m;
        const weatherCode = payload.current?.weather_code;

        setTemperatureText(
          typeof temperature === "number" ? `${Math.round(temperature)}°C` : "--°C",
        );
        setWeatherText(getWeatherLabel(weatherCode));
      } catch {
        if (cancelled) return;
        setTemperatureText("--°C");
        setWeatherText("天气 --");
      }
    };

    void fetchWeather();
    const timer = window.setInterval(
      () => {
        void fetchWeather();
      },
      30 * 60 * 1000,
    );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return {
    weatherText,
    temperatureText,
  };
}
