import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safely access env vars using a fallback object.
const env = (import.meta.env || {}) as any;

// Try to get config from Env Vars first, then LocalStorage
let supabaseUrl = env.VITE_SUPABASE_URL || localStorage.getItem('parnaso_supabase_url');
let supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('parnaso_supabase_key');

// Validate if they look somewhat correct (basic check)
const isConfiguredInternal = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http');
};

export const supabase: SupabaseClient | null = isConfiguredInternal()
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

export const updateSupabaseConfig = (url: string, key: string) => {
  if (!url || !key) return;
  localStorage.setItem('parnaso_supabase_url', url.trim());
  localStorage.setItem('parnaso_supabase_key', key.trim());
  // Reload page to re-initialize the client const
  window.location.reload();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('parnaso_supabase_url');
  localStorage.removeItem('parnaso_supabase_key');
  window.location.reload();
};
