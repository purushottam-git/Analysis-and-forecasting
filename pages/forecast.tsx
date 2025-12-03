
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ForecastModel, ForecastParams } from '../types';
import { runMovingAverage, runHoltWinters, calculateRMSE, calculateMAPE, fillMissingDates } from '../utils/forecasting';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Forecast: React.FC = () => {
  const { dailySales, transactions } = useData();
  const [selectedSku, setSelectedSku] = useState<string>('ALL');
  const [model, setModel] = useState<ForecastModel>(ForecastModel.MOVING_AVERAGE);
  const [horizon, setHorizon] = useState(14);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ rmse: 0, mape: 0 });

  const skus = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.sku)));
  }, [transactions]);

  const seriesData = useMemo(() => {
    if (selectedSku === 'ALL') return dailySales;
    
    const filtered = transactions.filter(t => t.sku === selectedSku);
    const agg = filtered.reduce((acc, curr) => {
      const date = curr.tx_date;
      if (!acc[date]) acc[date] = { date, total_sales: 0, total_quantity: 0 };
      acc[date].total_sales += Number(curr.amount);
      return acc;
    }, {} as any);
    
    return Object.values(agg).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [dailySales, transactions, selectedSku]);

  const handleRunForecast = () => {
    if (seriesData.length < 10) {
      alert("Not enough data to forecast. Need at least 10 data points.");
      return;
    }

    const contiguousData = fillMissingDates(seriesData as any);

    const params: ForecastParams = {
      model,
      horizon,
      windowSize: 7,
      alpha: 0.5,
      beta: 0.3,
      gamma: 0.2,
      seasonLength: 7
    };

    let result;
    if (model === ForecastModel.MOVING_AVERAGE) {
      result = runMovingAverage(contiguousData, params);
    } else {
      result = runHoltWinters(contiguousData, params);
    }

    setForecastData(result);

    const actuals = result.filter(r => r.actual !== undefined && r.forecast !== undefined).map(r => r.actual as number);
    const preds = result.filter(r => r.actual !== undefined && r.forecast !== undefined).map(r => r.forecast as number);
    
    setMetrics({
      rmse: calculateRMSE(actuals, preds),
      mape: calculateMAPE(actuals, preds)
    });
  };

  const downloadCSV = () => {
    if (forecastData.length === 0) return;
    const header = "date,actual,forecast,lower_ci,upper_ci\n";
    const rows = forecastData.map(r => 
      `${r.date},${r.actual || ''},${r.forecast?.toFixed(2) || ''},${r.lower_ci?.toFixed(2) || ''},${r.upper_ci?.toFixed(2) || ''}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_${selectedSku}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Demand Forecasting</h2>
          <p className="text-slate-500">Run in-browser models to predict future sales.</p>
        </div>
        <button 
          onClick={downloadCSV}
          disabled={forecastData.length === 0}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium disabled:opacity-50 hover:bg-slate-50 shadow-sm"
        >
          <i className="fa-solid fa-download mr-2"></i> Export CSV
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Series</label>
          <select 
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
          >
            <option value="ALL">Total Store Sales</option>
            {skus.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Model</label>
          <select 
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
            value={model}
            onChange={(e) => setModel(e.target.value as ForecastModel)}
          >
            <option value={ForecastModel.MOVING_AVERAGE}>Moving Average (Simple)</option>
            <option value={ForecastModel.HOLT_WINTERS}>Holt-Winters (Seasonality)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Horizon (Days)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
            value={horizon}
            onChange={(e) => setHorizon(Number(e.target.value))}
            min={1}
            max={365}
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={handleRunForecast}
            className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition"
          >
            Run Forecast
          </button>
        </div>
      </div>

      {forecastData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800">Forecast Visualization</h3>
             <div className="flex space-x-6 text-sm">
                <div>
                  <span className="text-slate-400 mr-2">RMSE:</span>
                  <span className="font-mono font-bold text-slate-700">{metrics.rmse.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">MAPE:</span>
                  <span className="font-mono font-bold text-slate-700">{metrics.mape.toFixed(2)}%</span>
                </div>
             </div>
           </div>
           
           <div className="h-96 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={forecastData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(d) => d.slice(5)} minTickGap={30} stroke="#94a3b8" />
                 <YAxis tick={{fontSize: 10}} stroke="#94a3b8" />
                 <Tooltip 
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                   formatter={(value: number) => value.toFixed(2)}
                 />
                 <Legend />
                 <Line type="monotone" dataKey="actual" stroke="#94a3b8" dot={false} strokeWidth={2} name="Actual Sales" />
                 <Line type="monotone" dataKey="forecast" stroke="#6366f1" dot={false} strokeWidth={2} name="Forecast" />
                 <Line type="monotone" dataKey="upper_ci" stroke="#a5b4fc" strokeDasharray="5 5" dot={false} strokeWidth={1} name="Upper Bound (95%)" />
                 <Line type="monotone" dataKey="lower_ci" stroke="#a5b4fc" strokeDasharray="5 5" dot={false} strokeWidth={1} name="Lower Bound (95%)" />
               </ComposedChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}

      <div className="bg-slate-100 p-4 rounded-xl text-sm text-slate-600">
        <strong>Note for Advanced Models:</strong> To run Prophet or ARIMA models, please download the Python notebook from the help section, run it in Google Colab with your Supabase keys, and the results will appear here automatically via the database integration.
      </div>
    </div>
  );
};

export default Forecast;
