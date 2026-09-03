import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8081/api';

export const getForecast = async (lat, lon, analysisId = null) => {
  try {
    const token = authService.getStoredAuth()?.token;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}`;
    if (analysisId) {
      url += `&analysisId=${analysisId}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch forecast: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Backend forecast fetch failed, generating client fallback forecast:', error);
    return generateFallbackForecast(lat, lon, analysisId);
  }
};

export const generateFallbackForecast = (lat, lon, analysisId) => {
  const baseDaily = 42.5; // kWh/day
  const rate = 8.5;
  const conditions = [
    { weather: 'Sunny', cloud: 12, temp: 30.5, sun: 9.5, factor: 0.98 },
    { weather: 'Sunny', cloud: 15, temp: 31.0, sun: 9.2, factor: 0.97 },
    { weather: 'Partly Cloudy', cloud: 35, temp: 29.5, sun: 8.4, factor: 0.88 },
    { weather: 'Partly Cloudy', cloud: 40, temp: 29.0, sun: 8.0, factor: 0.85 },
    { weather: 'Sunny', cloud: 10, temp: 31.5, sun: 9.8, factor: 0.99 },
    { weather: 'Cloudy', cloud: 70, temp: 27.5, sun: 5.4, factor: 0.70 },
    { weather: 'Rain', cloud: 85, temp: 25.0, sun: 3.5, factor: 0.50 },
    { weather: 'Partly Cloudy', cloud: 30, temp: 28.5, sun: 8.2, factor: 0.90 },
    { weather: 'Sunny', cloud: 14, temp: 30.0, sun: 9.3, factor: 0.96 },
    { weather: 'Sunny', cloud: 10, temp: 31.0, sun: 9.6, factor: 0.98 },
  ];

  const today = new Date();
  const forecast = conditions.map((item, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() + index);
    const dateStr = d.toISOString().split('T')[0];
    const gen = Math.round(baseDaily * item.factor * 10) / 10;
    const sav = Math.round(gen * rate * 10) / 10;

    return {
      date: dateStr,
      weather: item.weather,
      cloudCover: item.cloud,
      temperature: item.temp,
      sunshineHours: item.sun,
      predictedGeneration: gen,
      predictedSavings: sav,
    };
  });

  return {
    analysisId: analysisId || 1,
    baseGeneration: baseDaily * 365,
    forecast,
  };
};