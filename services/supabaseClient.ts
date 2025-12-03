import { createClient } from '@supabase/supabase-js';

// NOTE: In a real Next.js app, these would be process.env.NEXT_PUBLIC_...
// For this environment, we check if they exist, otherwise we might warn or run in demo mode.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

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
