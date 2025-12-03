import React, { useMemo } from 'react';
import { useData } from '../App';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, sub, icon, color }: any) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      <p className={`text-xs font-medium mt-2 ${sub.includes('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
        {sub}
      </p>
    </div>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${color}`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { transactions, dailySales, useDemoData } = useData();

  const stats = useMemo(() => {
    if (!transactions.length) return null;
    const totalRev = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalQty = transactions.reduce((sum, t) => sum + Number(t.quantity), 0);
    const avgOrder = totalRev / transactions.length;

    // Simple YoY/MoM sim
    const growth = "+12.5% vs last period";

    return {
      totalRev: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRev),
      totalQty: totalQty.toLocaleString(),
      avgOrder: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avgOrder),
      growth
    };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6">
          <i className="fa-solid fa-cloud-arrow-up text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Data Available</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Upload a CSV file to generate your dashboard, or load our demo dataset to see the app in action.
        </p>
        <div className="flex space-x-4">
          <Link to="/upload" className="px-6 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition">
            Upload CSV
          </Link>
          <button onClick={useDemoData} className="px-6 py-3 bg-indigo-600 rounded-xl text-white font-medium hover:bg-indigo-700 shadow-md transition shadow-indigo-200">
            Load Demo Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Retail analytics overview</p>
        </div>
        <div className="text-sm text-slate-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={stats?.totalRev} 
          sub={stats?.growth} 
          icon="fa-dollar-sign" 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Total Orders" 
          value={transactions.length} 
          sub="Orders processed" 
          icon="fa-shopping-bag" 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Avg Order Value" 
          value={stats?.avgOrder} 
          sub="Per transaction" 
          icon="fa-chart-pie" 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sales Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(d) => d.slice(5)} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Area 
                  type="monotone" 
                  dataKey="total_sales" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Transactions</h3>
          <div className="overflow-hidden">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium text-right">Amnt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 7).map((t, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-slate-600">{t.tx_date}</td>
                    <td className="px-3 py-2 font-mono text-xs text-indigo-600">{t.sku}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800">${Number(t.amount).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <Link to="/products" className="text-sm text-indigo-600 font-medium hover:text-indigo-800">View All Transactions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;