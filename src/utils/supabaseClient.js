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
                single: () => Promise.resolve({ data: null, error: { message: 'Faltan las credenciales de Supabase en Vercel' } }),
                order: () => ({ limit: () => Promise.resolve({ data: [], error: { message: 'Faltan las credenciales de Supabase en Vercel' } }) }),
                eq: () => Promise.resolve({ data: [], error: { message: 'Faltan las credenciales de Supabase en Vercel' } })
            }),
            insert: () => ({
                select: () => Promise.resolve({ data: [], error: { message: 'Faltan las credenciales de Supabase en Vercel' } })
            }),
            update: () => ({
                eq: () => Promise.resolve({ data: null, error: { message: 'Faltan las credenciales de Supabase en Vercel' } })
            }),
            delete: () => ({
                eq: () => Promise.resolve({ data: null, error: { message: 'Faltan las credenciales de Supabase en Vercel' } })
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
