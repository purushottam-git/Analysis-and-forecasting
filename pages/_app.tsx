
import React from 'react';
import type { AppProps } from 'next/app';
import Sidebar from '../components/Sidebar';
import { DataProvider } from '../context/DataContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DataProvider>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-6 py-8">
            <Component {...pageProps} />
          </div>
        </main>
      </div>
    </DataProvider>
  );
}

export default MyApp;
