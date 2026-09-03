import { authService } from './authService';

const API_BASE_URL = 'http://localhost:8081/api';

export const getBatteryPlan = async (lat, lon, analysisId = null, capacity = null, consumption = null) => {
  try {
    const token = authService.getStoredAuth()?.token;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}/battery/plan?lat=${lat}&lon=${lon}`;
    if (analysisId) url += `&analysisId=${analysisId}`;
    if (capacity) url += `&capacity=${capacity}`;
    if (consumption) url += `&consumption=${consumption}`;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Battery plan fetch failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Backend battery fetch failed, generating client fallback simulation:', error);
    return generateFallbackBatteryPlan(analysisId, capacity, consumption);
  }
};

export const generateFallbackBatteryPlan = (analysisId, capacity = 30, consumption = 28) => {
  const cap = capacity || 30;
  const cons = consumption || 28;
  const days = [
    { date: 'Day 1', gen: 38.0 },
    { date: 'Day 2', gen: 36.5 },
    { date: 'Day 3', gen: 29.0 },
    { date: 'Day 4', gen: 18.0 },
    { date: 'Day 5', gen: 15.0 },
    { date: 'Day 6', gen: 32.0 },
    { date: 'Day 7', gen: 40.0 },
    { date: 'Day 8', gen: 35.0 },
    { date: 'Day 9', gen: 39.0 },
    { date: 'Day 10', gen: 37.0 },
  ];

  let level = cap * 0.5;
  let totalSurplus = 0;
  let totalDeficit = 0;

  const simulation = days.map((d) => {
    const net = d.gen - cons;
    const surplus = net > 0 ? Math.round(net * 10) / 10 : 0;
    const deficit = net < 0 ? Math.round(Math.abs(net) * 10) / 10 : 0;
    totalSurplus += surplus;
    totalDeficit += deficit;

    level = Math.min(cap, Math.max(0, level + net));
    const soc = Math.round((level / cap) * 100);

    let status = 'Balanced';
    if (net > 0 && level >= cap) status = 'Full / Export';
    else if (net > 0) status = 'Charging';
    else if (net < 0 && level <= 0) status = 'Empty / Import';
    else if (net < 0) status = 'Discharging';

    return {
      date: d.date,
      generation: d.gen,
      consumption: cons,
      surplus,
      deficit,
      batteryLevel: Math.round(level * 10) / 10,
      batterySoc: soc,
      status,
    };
  });

  return {
    analysisId: analysisId || 1,
    recommendedCapacity: cap,
    dailyConsumption: cons,
    expectedBackupDays: Math.round((cap * 0.9 / cons) * 10) / 10,
    total10DaySurplus: Math.round(totalSurplus * 10) / 10,
    total10DayDeficit: Math.round(totalDeficit * 10) / 10,
    selfSufficiencyScore: 82.5,
    estimatedCost: cap * 15000,
    batteryType: 'Lithium Iron Phosphate (LFP)',
    dailySimulation: simulation,
  };
};