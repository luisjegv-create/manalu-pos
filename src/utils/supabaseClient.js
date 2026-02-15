import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
}

// Ensure the client doesn't crash if URL is empty (returns a non-functioning client instead of throwing)
export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : { from: () => ({ select: () => ({ single: () => ({ data: null, error: 'Missing Credentials' }), order: () => ({ limit: () => ({ data: [], error: 'Missing Credentials' }) }) }) }) };
