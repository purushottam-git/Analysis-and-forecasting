import React, { useMemo, useState } from 'react';
import { useData } from '../App';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';

interface Recommendation {
  sku: string;
  avgDemand: number;
  stdDev: number;
  safetyStock: number;
  reorderPoint: number;
  currentStock: number;
  status: 'Reorder' | 'Healthy';
  suggestedOrder: number;
  leadTime: number; // Days
  serviceLevel: number; // Percentage
}

const Recommendations: React.FC = () => {
  const { transactions } = useData();
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  const recommendations = useMemo(() => {
    // 1. Group by SKU
    const map = new Map();
    transactions.forEach(t => {
      if(!map.has(t.sku)) map.set(t.sku, { vals: [] });
      map.get(t.sku).vals.push(t.quantity);
    });

    const results: Recommendation[] = [];
    map.forEach((data, sku) => {
      // Calculate Mean and StdDev of daily demand
      const n = data.vals.length;
      const mean = data.vals.reduce((a:number,b:number)=>a+b, 0) / n;
      const variance = data.vals.reduce((a:number,b:number)=>a + Math.pow(b-mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      // Assumptions (Hardcoded for demo, but could be configurable)
      const leadTime = 7; // days
      const serviceLevelZ = 1.65; // ~95%
      
      const safetyStock = serviceLevelZ * stdDev * Math.sqrt(leadTime);
      const reorderPoint = (mean * leadTime) + safetyStock;
      
      // Mock current stock based on reorder point to guarantee some "Reorder" items for demo
      // Deterministic "random" based on SKU string length for consistency
      const seed = sku.length % 3; 
      let currentStock;
      if (seed === 0) currentStock = Math.floor(reorderPoint * 0.4); // Low stock
      else if (seed === 1) currentStock = Math.floor(reorderPoint * 1.2); // Healthy
      else currentStock = Math.floor(reorderPoint * 2.5); // Overstockish

      const status = currentStock < reorderPoint ? 'Reorder' : 'Healthy';
      const orderQty = Math.ceil(reorderPoint * 2 - currentStock); // Target 2x Reorder point

      results.push({
        sku,
        avgDemand: mean,
        stdDev,
        safetyStock,
        reorderPoint,
        currentStock,
        status,
        suggestedOrder: status === 'Reorder' ? orderQty : 0,
        leadTime,
        serviceLevel: 95
      });
    });

    // Sort: Reorder first, then by SKU
    return results.sort((a,b) => (b.status === 'Reorder' ? 1 : -1) - (a.status === 'Reorder' ? 1 : -1));
  }, [transactions]);

  // Modal Component
  const DetailModal = ({ rec, onClose }: { rec: Recommendation, onClose: () => void }) => {
    if (!rec) return null;

    const chartData = [
      { name: 'Current', value: rec.currentStock, fill: rec.status === 'Reorder' ? '#f43f5e' : '#10b981' },
      { name: 'Reorder Pt', value: rec.reorderPoint, fill: '#6366f1' },
      { name: 'Safety Stk', value: rec.safetyStock, fill: '#f59e0b' },
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <i className="fa-solid fa-box-open text-indigo-500"></i>
                {rec.sku}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Inventory Detail & Analysis</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${rec.status === 'Reorder' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {rec.status.toUpperCase()}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Avg Daily Demand</p>
                <p className="text-xl font-bold text-slate-700">{rec.avgDemand.toFixed(1)} <span className="text-xs font-normal text-slate-400">units</span></p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Lead Time</p>
                <p className="text-xl font-bold text-slate-700">{rec.leadTime} <span className="text-xs font-normal text-slate-400">days</span></p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Volatility (σ)</p>
                <p className="text-xl font-bold text-slate-700">±{rec.stdDev.toFixed(1)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Service Level</p>
                <p className="text-xl font-bold text-slate-700">{rec.serviceLevel}%</p>
              </div>
            </div>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Formula & Explanation */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">Calculation Logic</h4>
                <div className="text-sm text-slate-600 space-y-3">
                  <p>
                    <span className="font-semibold text-indigo-600">Reorder Point ({rec.reorderPoint.toFixed(1)})</span> = <br/>
                    (Avg Demand × Lead Time) + Safety Stock
                  </p>
                  <p>
                    <span className="font-semibold text-amber-500">Safety Stock ({rec.safetyStock.toFixed(1)})</span> = <br/>
                    Z-Score (1.65) × StdDev × √LeadTime
                  </p>
                  <div className="bg-indigo-50 p-3 rounded-lg text-indigo-700 text-xs mt-2">
                    <i className="fa-solid fa-circle-info mr-2"></i>
                    {rec.status === 'Reorder' 
                      ? `Stock is below the reorder point by ${(rec.reorderPoint - rec.currentStock).toFixed(0)} units. Immediate action recommended.`
                      : `Stock levels are healthy. You are ${(rec.currentStock - rec.reorderPoint).toFixed(0)} units above the reorder threshold.`}
                  </div>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-48">
                <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-2">Inventory Levels</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{fontSize: 10}} width={70} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-end space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
            {rec.status === 'Reorder' && (
              <button 
                onClick={() => { alert(`Purchase order created for ${rec.suggestedOrder} units of ${rec.sku}`); onClose(); }}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 transition-all font-medium"
              >
                <i className="fa-solid fa-cart-plus mr-2"></i>
                Create Purchase Order ({rec.suggestedOrder} units)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Inventory Recommendations</h2>
        <p className="text-slate-500">
          Smart reorder suggestions based on demand volatility and safety stock analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec) => {
          // Calculate percentage for progress bar (capped at 100%)
          const fillPercent = Math.min(100, (rec.currentStock / (rec.reorderPoint * 1.5)) * 100);
          
          return (
            <div 
              key={rec.sku} 
              onClick={() => setSelectedRec(rec)}
              className={`group relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-lg ${
                rec.status === 'Reorder' 
                  ? 'bg-white border-rose-200 shadow-sm shadow-rose-50 hover:border-rose-300' 
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
               {/* Header */}
               <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center space-x-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${rec.status === 'Reorder' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                      <i className={`fa-solid ${rec.status === 'Reorder' ? 'fa-triangle-exclamation' : 'fa-check'}`}></i>
                   </div>
                   <div>
                     <h3 className="font-mono font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{rec.sku}</h3>
                     <p className="text-xs text-slate-400">Lead Time: {rec.leadTime} days</p>
                   </div>
                 </div>
                 <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-indigo-400 transition-colors"></i>
               </div>
               
               {/* Visual Inventory Bar */}
               <div className="mb-4">
                 <div className="flex justify-between text-xs mb-1">
                   <span className="font-semibold text-slate-500">Stock Level</span>
                   <span className={rec.status === 'Reorder' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                     {rec.currentStock} / {rec.reorderPoint.toFixed(0)} (RP)
                   </span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div 
                     className={`h-full rounded-full transition-all duration-500 ${rec.status === 'Reorder' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                     style={{ width: `${fillPercent}%` }}
                   ></div>
                 </div>
               </div>

               {/* Metrics Grid */}
               <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-slate-50">
                  <div>
                    <span className="block text-slate-400 text-xs uppercase font-bold">Safety Stock</span>
                    <span className="font-mono text-slate-700">{rec.safetyStock.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-xs uppercase font-bold">Suggested</span>
                    <span className={`font-mono font-bold ${rec.status === 'Reorder' ? 'text-rose-600' : 'text-slate-400'}`}>
                      {rec.suggestedOrder > 0 ? `+${rec.suggestedOrder}` : '-'}
                    </span>
                  </div>
               </div>

               {rec.status === 'Reorder' && (
                 <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full -mr-1 -mt-1 ring-4 ring-white"></div>
               )}
            </div>
          );
        })}
      </div>

      {/* Render Modal */}
      {selectedRec && <DetailModal rec={selectedRec} onClose={() => setSelectedRec(null)} />}
    </div>
  );
};

export default Recommendations;