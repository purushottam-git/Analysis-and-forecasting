import { createClient } from '@supabase/supabase-js';

// Default credentials from configuration
const DEFAULT_URL = "https://brnogvyblbmctcrszezt.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybm9ndnlibGJtY3RjcnN6ZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MzAxMTIsImV4cCI6MjA4MDMwNjExMn0.bPGIahFoq-JvS1cZ-JlV69juf_g4qcnS7D5-SwJ6heY";

// Safe retrieval of environment variables
const getEnvVar = (key: string, defaultValue: string) => {
  try {
    // Check if import.meta.env exists (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors if import.meta is not supported
  }
  return defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', DEFAULT_URL);
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', DEFAULT_KEY);

// Debug log to check connectivity (can be removed in production)
console.log('Supabase Configuration Status:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  usingDefault: supabaseUrl === DEFAULT_URL
});

export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const uploadFileToStorage = async (file: File, bucket: string) => {
  if (!supabase) {
    console.error("Supabase client not initialized. Check environment variables.");
    return null;
  }
  
  // Sanitize filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${Date.now()}_${sanitizedName}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
    
  if (error) {
    console.error('Upload error:', error);
    throw error;
  }
  return data;
};