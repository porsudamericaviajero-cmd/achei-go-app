import { createClient } from '@supabase/supabase-js';

// Lê variáveis de ambiente (injetadas pelo Vite ou Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validação se as chaves foram preenchidas e são válidas
export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('seu-projeto.supabase.co')
);

// Cria o cliente Supabase apenas se configurado
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured() {
  return isConfigured;
}

// Chave mestra de acesso rápido para o Painel Admin
export const ADMIN_ACCESS_KEY = import.meta.env.VITE_ADMIN_ACCESS_KEY || 'admin123456';
