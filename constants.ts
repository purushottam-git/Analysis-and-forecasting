import { Transaction } from "./types";

export const MOCK_TRANSACTIONS: Transaction[] = Array.from({ length: 300 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (299 - i));
  const dateStr = date.toISOString().split('T')[0];
  
  // Create a slight trend and seasonality
  const base = 100 + i * 0.5;
  const season = Math.sin(i / 7) * 20;
  const random = Math.random() * 40 - 20;
  
  return {
    order_id: `ORD-${1000 + i}`,
    sku: i % 2 === 0 ? 'SKU-001' : 'SKU-002',
    tx_date: dateStr,
    quantity: Math.max(1, Math.floor((base + season + random) / 10)),
    amount: Math.max(10, base + season + random),
    store_id: 'STORE-Main',
  };
});
