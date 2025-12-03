import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Products from './pages/Products';
import Analysis from './pages/Analysis';
import Forecast from './pages/Forecast';
import Recommendations from './pages/Recommendations';
import { Transaction, DailySales } from './types';
import { MOCK_TRANSACTIONS } from './constants';

// Data Context
interface DataContextType {
  transactions: Transaction[];
  setTransactions: (data: Transaction[]) => void;
  dailySales: DailySales[];
  useDemoData: () => void;
}

const DataContext = createContext<DataContextType>({
  transactions: [],
  setTransactions: () => {},
  dailySales: [],
  useDemoData: () => {},
});

export const useData = () => useContext(DataContext);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);

  useEffect(() => {
    // Aggregation logic
    if (transactions.length === 0) {
      setDailySales([]);
      return;
    }

    const agg = transactions.reduce((acc, curr) => {
      const date = curr.tx_date;
      if (!acc[date]) {
        acc[date] = { date, total_sales: 0, total_quantity: 0 };
      }
      acc[date].total_sales += Number(curr.amount);
      acc[date].total_quantity += Number(curr.quantity);
      return acc;
    }, {} as Record<string, DailySales>);

    const sorted = Object.values(agg).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setDailySales(sorted);
  }, [transactions]);

  const useDemoData = () => {
    setTransactions(MOCK_TRANSACTIONS);
  };

  return (
    <DataContext.Provider value={{ transactions, setTransactions, dailySales, useDemoData }}>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <ScrollToTop />
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/products" element={<Products />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/recommendations" element={<Recommendations />} />
            </Routes>
          </div>
        </main>
      </div>
    </DataContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;