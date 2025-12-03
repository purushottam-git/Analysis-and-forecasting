import React from 'react';
import { useData } from '../App';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fillMissingDates } from '../utils/forecasting';

// A simple manual seasonal decomposition for visualization
// (Actual - Trend = Seasonality + Residual)
const Analysis: React.FC = () => {
  const { dailySales } = useData();

  if (dailySales.length < 14) return <div className="p-8 text-center text-slate-500">Not enough data for decomposition.</div>;

  // Use filled data to ensure X-axis is linear and 7-day MA makes sense
  const contiguousData = fillMissingDates(dailySales);

  // Simple 7-day Moving Average as Trend
  const data = contiguousData.map((d, i) => {
    let trend = 0;
    if (i >= 3 && i < contiguousData.length - 3) {
      const window = contiguousData.slice(i - 3, i + 4);
      trend = window.reduce((sum, item) => sum + item.total_sales, 0) / 7;
    } else {
      trend = d.total_sales; // Fallback
    }
    const detrended = d.total_sales - trend;
    return {
      date: d.date,
      actual: d.total_sales,
      trend,
      seasonal: detrended, // Simplified: treating remainder as seasonal+noise
    };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Seasonal Decomposition</h2>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Trend (7-day MA)</h3>
          <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="date" hide />
                 <YAxis tick={{fontSize: 10}} />
                 <Tooltip />
                 <Bar dataKey="trend" fill="#6366f1" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Seasonality & Residuals</h3>
           <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{fontSize: 10}} />
                 <YAxis tick={{fontSize: 10}} />
                 <Tooltip />
                 <Bar dataKey="seasonal" fill="#f59e0b" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;