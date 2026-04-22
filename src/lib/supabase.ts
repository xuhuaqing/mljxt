import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'teacher' | 'merchant' | 'developer' | 'user';

export interface Profile {
  id: string;
  phone: string | null;
  role: UserRole;
  display_name: string;
  created_at: string;
  updated_at: string;
}
