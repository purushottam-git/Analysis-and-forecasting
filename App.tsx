import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { DataProvider, useData as useDataContext } from './context/DataContext';

// Fix casing imports to match file system and Next.js structure
import Dashboard from './pages/index';
import Upload from './pages/Upload';
import Products from './pages/Products';
import Analysis from './pages/Analysis';
import Forecast from './pages/Forecast';
import Recommendations from './pages/Recommendations';

// Re-export useData for backward compatibility
export const useData = useDataContext;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  return (
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
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </DataProvider>
  );
};

export default App;