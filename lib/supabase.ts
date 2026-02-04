import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely access localStorage (prevents build crashes in non-browser envs)
const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

// Safely access env vars. 
// We cast import.meta to any to avoid TS errors if vite-env.d.ts is missing or not picked up immediately.
const env = (import.meta as any).env || {};

// Try to get config from Env Vars first, then LocalStorage
let supabaseUrl = env.VITE_SUPABASE_URL || getStorageItem('parnaso_supabase_url');
let supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || getStorageItem('parnaso_supabase_key');

// Validate if they look somewhat correct (basic check)
const isConfiguredInternal = () => {
  return typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string' && supabaseUrl.startsWith('http');
};

export const supabase: SupabaseClient | null = isConfiguredInternal()
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

export const updateSupabaseConfig = (url: string, key: string) => {
  if (!url || !key) return;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('parnaso_supabase_url', url.trim());
    localStorage.setItem('parnaso_supabase_key', key.trim());
    window.location.reload();
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('parnaso_supabase_url');
    localStorage.removeItem('parnaso_supabase_key');
    window.location.reload();
  }
};
