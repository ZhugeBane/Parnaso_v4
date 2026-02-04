import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely access localStorage (prevents build crashes in non-browser envs)
const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

// Force cast import.meta to unknown then to a shape with env to satisfy strict TS
const metaEnv = (import.meta as unknown as { env: Record<string, string> }).env || {};

// Try to get config from Env Vars first, then LocalStorage
let supabaseUrl = metaEnv.VITE_SUPABASE_URL || getStorageItem('parnaso_supabase_url');
let supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || getStorageItem('parnaso_supabase_key');

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
