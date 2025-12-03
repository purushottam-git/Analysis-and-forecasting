
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface ProductSummary {
  sku: string;
  totalSales: number;
  totalQty: number;
  avgPrice: number;
  trend: { val: number }[];
}

const Products: React.FC = () => {
  const { transactions } = useData();
  const [search, setSearch] = useState('');

  const products = useMemo(() => {
    const map = new Map<string, ProductSummary>();
    
    const sortedTx = [...transactions].sort((a,b) => a.tx_date.localeCompare(b.tx_date));

    sortedTx.forEach(t => {
      if (!map.has(t.sku)) {
        map.set(t.sku, { sku: t.sku, totalSales: 0, totalQty: 0, avgPrice: 0, trend: [] });
      }
      const p = map.get(t.sku)!;
      p.totalSales += Number(t.amount);
      p.totalQty += Number(t.quantity);
      p.trend.push({ val: Number(t.amount) });
    });

    return Array.from(map.values()).map(p => ({
      ...p,
      avgPrice: p.totalSales / p.totalQty,
      trend: p.trend.filter((_, i) => i % Math.ceil(p.trend.length / 20) === 0) 
    }));
  }, [transactions]);

  const filtered = products.filter(p => 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Product Performance</h2>
        <div className="relative">
          <i className="fa-solid fa-search absolute left-3 top-3 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search SKU..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4 text-right">Total Revenue</th>
              <th className="px-6 py-4 text-right">Units Sold</th>
              <th className="px-6 py-4 text-right">Avg Price</th>
              <th className="px-6 py-4 w-48">Trend (Last 30d)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.sku} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-indigo-600 font-medium">{p.sku}</td>
                <td className="px-6 py-4 text-right font-medium text-slate-800">
                  ${p.totalSales.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </td>
                <td className="px-6 py-4 text-right text-slate-600">{p.totalQty.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-slate-600">${p.avgPrice.toFixed(2)}</td>
                <td className="px-6 py-2">
                  <div className="h-10 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={p.trend}>
                        <Area type="monotone" dataKey="val" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
