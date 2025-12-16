import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './endpoints';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client for frontend
 */
export function getSupabase(): SupabaseClient | null {
    if (!config.supabase.url || !config.supabase.anonKey) {
        console.log('[Supabase] Not configured, running in demo mode');
        return null;
    }

    if (!supabaseClient) {
        supabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            },
        });
        console.log('[Supabase] Client initialized');
    }

    return supabaseClient;
}

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
    return !!(config.supabase.url && config.supabase.anonKey);
}

export default getSupabase;
