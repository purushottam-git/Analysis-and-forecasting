
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Transaction, DailySales } from '../types';
import { MOCK_TRANSACTIONS } from '../constants';

// Data Context Interface
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      {children}
    </DataContext.Provider>
  );
};
