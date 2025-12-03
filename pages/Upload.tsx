import React, { useState } from 'react';
import Papa from 'papaparse';
import { useData } from '../App';
import { useNavigate } from 'react-router-dom';
import { supabase, uploadFileToStorage } from '../services/supabaseClient';
import { Transaction } from '../types';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const { setTransactions } = useData();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Helper to check if file is parseable data (CSV or Excel)
  const isDataFile = (f: File) => {
    return f.name.match(/\.(csv|xlsx|xls)$/i);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError('');
      setSuccessMsg('');
      
      // If it's a data file, try to preview it
      if (isDataFile(selectedFile)) {
        previewFile(selectedFile);
      } else {
        setParsedData([]); // clear preview for non-data files
      }
    }
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const XLSX = (window as any).XLSX;
          if (!XLSX) {
            reject(new Error("Excel parser not loaded. Please refresh the page."));
            return;
          }
          const wb = XLSX.read(data, { type: 'binary' });
          const wsName = wb.SheetNames[0];
          const ws = wb.Sheets[wsName];
          const json = XLSX.utils.sheet_to_json(ws);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsBinaryString(file);
    });
  };

  const previewFile = async (fileToParse: File) => {
    try {
      if (fileToParse.name.endsWith('.csv')) {
        Papa.parse(fileToParse, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              setParsedData(results.data.slice(0, 5));
            }
          },
          error: (err) => setError('Failed to parse CSV: ' + err.message)
        });
      } else if (fileToParse.name.match(/\.(xlsx|xls)$/i)) {
        const json = await parseExcel(fileToParse);
        if (json && json.length > 0) {
          setParsedData(json.slice(0, 5));
        }
      }
    } catch (err: any) {
      setError("Error reading file: " + err.message);
    }
  };

  const mapAndSave = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      // 1. Upload raw to Supabase Storage (Any file type)
      if (supabase) {
        await uploadFileToStorage(file, 'uploads');
      }

      // If it's NOT a data file (e.g. PDF, ZIP), we stop here
      if (!isDataFile(file)) {
        setLoading(false);
        setSuccessMsg(`File "${file.name}" uploaded to storage successfully.`);
        return;
      }

      // 2. Parse full file (CSV or Excel)
      let rawData: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              rawData = results.data;
              resolve();
            },
            error: (err) => reject(err)
          });
        });
      } else if (file.name.match(/\.(xlsx|xls)$/i)) {
        rawData = await parseExcel(file);
      }

      if (rawData.length === 0) {
        throw new Error("No data found in file.");
      }

      // 3. Normalize Data
      // Helper to find key case-insensitively
      const findKey = (obj: any, candidates: string[]) => {
        const keys = Object.keys(obj);
        for (const c of candidates) {
          const found = keys.find(k => k.toLowerCase() === c.toLowerCase());
          if (found) return obj[found];
        }
        return null;
      };

      const formatted: Transaction[] = rawData.map((row: any) => {
        // Robust mapping
        const quantity = Number(findKey(row, ['quantity', 'qty', 'units', 'count']) || 1);
        const amount = Number(findKey(row, ['amount', 'price', 'total', 'revenue', 'sales']) || 0);

        return {
          order_id: findKey(row, ['order_id', 'id', 'order', 'transaction_id']) || `ORD-${Math.random().toString(36).substr(2, 5)}`,
          sku: findKey(row, ['sku', 'product_id', 'item_id', 'product']) || 'UNKNOWN',
          tx_date: findKey(row, ['tx_date', 'date', 'day', 'timestamp']) || new Date().toISOString().split('T')[0],
          quantity: isNaN(quantity) ? 1 : quantity,
          amount: isNaN(amount) ? 0 : amount,
          store_id: findKey(row, ['store_id', 'store', 'shop']) || 'STORE-1'
        };
      }).filter(t => t.amount > 0 || t.quantity > 0); // Filter out empty/invalid rows

      // 4. Insert into Supabase DB (if configured)
      if (supabase) {
          const { error } = await supabase.from('transactions').insert(formatted);
          if (error) throw error;
      }

      // 5. Update local state
      setTransactions(formatted);
      setLoading(false);
      navigate('/');

    } catch (err: any) {
      setError(err.message || 'An error occurred during processing');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Upload Data</h2>
        <p className="text-slate-500">
          Upload Sales Data (CSV, Excel) to populate the dashboard, or upload other documents (PDF, ZIP) for archival.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls, .pdf, .zip, .json, .png, .jpg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center pointer-events-none">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-700">
              {file ? file.name : "Click or drag file here"}
            </h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm">
              <span className="font-bold text-slate-600">Supported for Analysis:</span> CSV, Excel (.xlsx, .xls)<br/>
              <span className="text-xs">Other files (PDF, ZIP, JSON) will be saved to storage only.</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-100 flex items-center">
            <i className="fa-solid fa-circle-exclamation mr-2"></i>
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-600 rounded-lg text-sm border border-emerald-100 flex items-center">
             <i className="fa-solid fa-check-circle mr-2"></i>
             {successMsg}
          </div>
        )}

        {parsedData.length > 0 && (
          <div className="mt-8 animate-fade-in">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              Preview Data ({file?.name.match(/\.xlsx?$/) ? 'Excel' : 'CSV'})
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 font-medium text-slate-500">
                  <tr>
                    {Object.keys(parsedData[0]).map(key => (
                      <th key={key} className="px-3 py-2 border-b whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedData.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-3 py-2 text-slate-600 whitespace-nowrap">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={mapAndSave}
            disabled={!file || loading}
            className={`px-6 py-3 rounded-xl font-medium text-white shadow-lg shadow-indigo-200 transition-all ${
              !file || loading 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'
            }`}
          >
            {loading ? (
              <span><i className="fa-solid fa-spinner fa-spin mr-2"></i>Processing...</span>
            ) : (
              file && !isDataFile(file) ? 'Upload to Storage' : 'Process & Analyze'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;