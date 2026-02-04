
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// --- MOCK LOCAL FALLBACK (Para não quebrar se não tiver configurado) ---
const LOCAL_USERS_KEY = 'parnaso_users';
const LOCAL_CURRENT_KEY = 'parnaso_current_user';

export const register = async (name: string, email: string, password: string): Promise<User> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado. Configure as variáveis de ambiente.");
  }

  // 1. Register in Supabase Auth
  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: {
      data: { name } // Passa o nome para o metadata
    }
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Erro ao criar usuário.");

  // O Trigger do SQL cria o perfil automaticamente na tabela 'profiles'

  return {
    id: data.user.id,
    name,
    email,
    role: 'user', // Default
    isBlocked: false
  };
};

export const login = async (email: string, password: string): Promise<User> => {
  if (!isSupabaseConfigured()) {
     throw new Error("Conexão com servidor não configurada.");
  }

  const { data, error } = await supabase!.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw new Error("E-mail ou senha inválidos.");
  
  // Fetch profile details
  const { data: profile } = await supabase!
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profile?.is_blocked) {
    await supabase!.auth.signOut();
    throw new Error("Conta bloqueada pelo administrador.");
  }

  return {
    id: data.user.id,
    name: profile?.name || 'Usuário',
    email: data.user.email!,
    role: (profile?.role as 'admin' | 'user') || 'user',
    isBlocked: profile?.is_blocked || false
  };
};

export const logout = async () => {
  if (isSupabaseConfigured()) {
    await supabase!.auth.signOut();
  }
  localStorage.removeItem(LOCAL_CURRENT_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data: { session } } = await supabase!.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase!
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return {
    id: session.user.id,
    name: profile?.name || session.user.user_metadata.name || 'Usuário',
    email: session.user.email!,
    role: (profile?.role as 'admin' | 'user') || 'user',
    isBlocked: profile?.is_blocked
  };
};

// --- Admin Functions (Async now) ---

export const getAllUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabase!.from('profiles').select('*');
  
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: (p.role as 'admin' | 'user') || 'user',
    isBlocked: p.is_blocked
  }));
};

export const toggleUserBlock = async (userId: string, currentStatus: boolean): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  await supabase!.from('profiles').update({ is_blocked: !currentStatus }).eq('id', userId);
};

export const deleteUser = async (userId: string): Promise<void> => {
   // Nota: Supabase não permite deletar usuário da Auth via Client por segurança,
   // apenas via Service Role (Backend). Aqui vamos apenas marcar como bloqueado ou deletar dados.
   // Para deletar de verdade, precisaria de uma Edge Function.
   // Vamos deletar o perfil da tabela profiles.
   if (!isSupabaseConfigured()) return;
   await supabase!.from('profiles').delete().eq('id', userId);
};

export const checkUserExists = async (email: string): Promise<boolean> => {
  // Client side cannot check if email exists easily without attempting login/signup logic in Supabase
  // We skip this for now or try a dummy recover
  return true; 
};

export const resetPassword = async (email: string) => {
  if (isSupabaseConfigured()) {
    await supabase!.auth.resetPasswordForEmail(email);
  }
};
