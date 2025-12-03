import { createClient } from '@supabase/supabase-js';

// Robust environment variable accessor for Vite, Next.js, and CRA
const getEnv = (key: string, viteKey: string): string => {
  try {
    // Check standard process.env (Next.js / Node / Webpack)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return String(process.env[key]);
    }
  } catch (e) {
    // Ignore errors accessing process
  }

  try {
    // Check import.meta.env (Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return String(import.meta.env[viteKey]);
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }
  
  return '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const uploadFileToStorage = async (file: File, bucket: string) => {
  if (!supabase) return null;
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
    
  if (error) {
    console.error('Upload error:', error);
    throw error;
  }
  return data;
};