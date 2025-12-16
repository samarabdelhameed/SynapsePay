import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Create a new Supabase client
 */
export function createClient(supabaseUrl: string, supabaseKey: string): SupabaseClient {
    if (client) {
        return client;
    }

    client = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    return client;
}

/**
 * Get the existing Supabase client
 * Throws if not initialized
 */
export function getClient(): SupabaseClient {
    if (!client) {
        // Try to initialize from environment variables
        const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        if (url && key) {
            return createClient(url, key);
        }

        throw new Error('Supabase client not initialized. Call createClient() first or set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    return client;
}

/**
 * Check if client is initialized
 */
export function isInitialized(): boolean {
    return client !== null;
}
