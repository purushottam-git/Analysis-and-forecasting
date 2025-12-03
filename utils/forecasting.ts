import { ForecastPoint, DailySales, ForecastParams, ForecastModel } from '../types';

// Helper to add days to a date string
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Helper to fill missing dates with zero values to ensure continuous time series
export const fillMissingDates = (data: DailySales[]): DailySales[] => {
  if (data.length === 0) return [];
  // Sort just in case
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const filled: DailySales[] = [];
  const startDate = new Date(sorted[0].date);
  const endDate = new Date(sorted[sorted.length - 1].date);
  
  const map = new Map(sorted.map(d => [d.date, d]));
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (map.has(dateStr)) {
      filled.push(map.get(dateStr)!);
    } else {
      filled.push({ date: dateStr, total_sales: 0, total_quantity: 0 });
    }
  }
  return filled;
};

// Calculate RMSE
export const calculateRMSE = (actual: number[], predicted: number[]): number => {
  if (actual.length === 0) return 0;
  const sumSqErr = actual.reduce((acc, val, i) => {
    const err = val - (predicted[i] || 0);
    return acc + err * err;
  }, 0);
  return Math.sqrt(sumSqErr / actual.length);
};

// Calculate MAPE
export const calculateMAPE = (actual: number[], predicted: number[]): number => {
  if (actual.length === 0) return 0;
  const sumPctErr = actual.reduce((acc, val, i) => {
    if (val === 0) return acc; // Avoid division by zero
    return acc + Math.abs((val - (predicted[i] || 0)) / val);
  }, 0);
  return (sumPctErr / actual.length) * 100;
};

// Moving Average Implementation
export const runMovingAverage = (
  data: DailySales[],
  params: ForecastParams
): ForecastPoint[] => {
  const windowSize = params.windowSize || 7;
  const result: ForecastPoint[] = [];
  const values = data.map(d => d.total_sales);

  // 1. History with fitted values
  for (let i = 0; i < data.length; i++) {
    let ma = null;
    if (i >= windowSize) {
      const window = values.slice(i - windowSize, i);
      const sum = window.reduce((a, b) => a + b, 0);
      ma = sum / windowSize;
    }
    result.push({
      date: data[i].date,
      actual: values[i],
      forecast: ma !== null ? ma : undefined,
    });
  }

  // 2. Future Forecast
  const lastDate = data[data.length - 1].date;
  // Simple MA forecast is the average of the last window
  const lastWindow = values.slice(values.length - windowSize);
  const nextVal = lastWindow.reduce((a, b) => a + b, 0) / windowSize;

  // Confidence Interval estimation (Standard Deviation of errors)
  const errors = result
    .filter(r => r.actual !== undefined && r.forecast !== undefined)
    .map(r => (r.actual as number) - (r.forecast as number));
  
  const stdDev = Math.sqrt(
    errors.reduce((sq, n) => sq + n * n, 0) / (errors.length - 1 || 1)
  );

  for (let h = 1; h <= params.horizon; h++) {
    // For simple MA, the forecast tends to be flat or iteratively updated. 
    // We will use the flat projection of the last calculated MA for simplicity in this demo.
    result.push({
      date: addDays(lastDate, h),
      forecast: nextVal,
      lower_ci: nextVal - 1.96 * stdDev,
      upper_ci: nextVal + 1.96 * stdDev,
    });
  }

  return result;
};

// Holt-Winters (Triple Exponential Smoothing) - Additive
export const runHoltWinters = (
  data: DailySales[],
  params: ForecastParams
): ForecastPoint[] => {
  const alpha = params.alpha || 0.5;
  const beta = params.beta || 0.4;
  const gamma = params.gamma || 0.1;
  const seasonLength = params.seasonLength || 7;
  const horizon = params.horizon;

  const values = data.map(d => d.total_sales);
  const n = values.length;

  // Initialize
  let level = values[0];
  let trend = (values[1] - values[0]); // Simple initial trend
  
  // Initial seasonal indices
  const seasonals = new Array(seasonLength).fill(0).map((_, i) => {
    return values[i % seasonLength] - level; 
  });

  const result: ForecastPoint[] = [];
  const fitted: number[] = [];

  // Iterate History
  for (let i = 0; i < n; i++) {
    const val = values[i];
    const prevLevel = level;
    const prevTrend = trend;
    const seasonIdx = i % seasonLength;
    const prevSeason = seasonals[seasonIdx];

    // Holt-Winters Update Steps (Additive)
    // Level
    level = alpha * (val - prevSeason) + (1 - alpha) * (prevLevel + prevTrend);
    // Trend
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    // Seasonal
    seasonals[seasonIdx] = gamma * (val - level) + (1 - gamma) * prevSeason;

    const forecastVal = level + trend + seasonals[seasonIdx];
    fitted.push(forecastVal);
    
    result.push({
      date: data[i].date,
      actual: val,
      // We align forecast: for T=i, the model predicts T=i based on T=i-1 state roughly
      // But strictly HW calculates T+1. For visualization, we often show "fitted" at T.
      forecast: i === 0 ? val : fitted[i-1], 
    });
  }

  // Calculate StdDev of residuals for CI
  const residuals = values.map((v, i) => v - (fitted[i] || v));
  const stdDev = Math.sqrt(residuals.reduce((a, b) => a + b*b, 0) / n);

  // Future Forecast
  const lastDate = data[n - 1].date;
  for (let h = 1; h <= horizon; h++) {
    const seasonIdx = (n + h - 1) % seasonLength;
    const forecast = level + h * trend + seasonals[seasonIdx];
    
    // Scale CI over time slightly
    const uncertainty = 1.96 * stdDev * Math.sqrt(h); 

    result.push({
      date: addDays(lastDate, h),
      forecast: Math.max(0, forecast), // Clamp negative sales
      lower_ci: Math.max(0, forecast - uncertainty),
      upper_ci: forecast + uncertainty
    });
  }

  return result;
};