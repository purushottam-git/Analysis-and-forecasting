export interface Transaction {
  order_id: string;
  sku: string;
  tx_date: string; // ISO date string YYYY-MM-DD
  quantity: number;
  amount: number;
  store_id: string;
}

export interface Product {
  sku: string;
  name: string;
  category: string;
  cost_price: number;
  sale_price: number;
}

export interface DailySales {
  date: string;
  total_sales: number;
  total_quantity: number;
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast?: number;
  lower_ci?: number;
  upper_ci?: number;
}

export enum ForecastModel {
  MOVING_AVERAGE = 'Moving Average',
  HOLT_WINTERS = 'Holt-Winters (Exp Smoothing)',
}

export interface ForecastParams {
  model: ForecastModel;
  windowSize?: number; // For Moving Average
  alpha?: number; // Level smoothing
  beta?: number; // Trend smoothing
  gamma?: number; // Seasonal smoothing
  seasonLength?: number;
  horizon: number;
}

export interface KPIData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  soldItems: number;
  revenueGrowth: number; // Percentage
}