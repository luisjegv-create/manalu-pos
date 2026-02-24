import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
}

export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => ({
                single: () => Promise.resolve({ data: null, error: 'Missing Credentials' }),
                order: () => ({ limit: () => Promise.resolve({ data: [], error: 'Missing Credentials' }) }),
                eq: () => Promise.resolve({ data: [], error: 'Missing Credentials' })
            }),
            insert: () => ({
                select: () => Promise.resolve({ data: [], error: 'Missing Credentials' })
            }),
            update: () => ({
                eq: () => Promise.resolve({ data: null, error: 'Missing Credentials' })
            }),
            delete: () => ({
                eq: () => Promise.resolve({ data: null, error: 'Missing Credentials' })
            })
        }),
        channel: () => ({
            on: () => ({
                subscribe: () => ({})
            }),
            subscribe: () => ({})
        }),
        removeChannel: () => { }
    };
