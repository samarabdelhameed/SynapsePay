/**
 * SynapsePay Configuration
 * Centralized config for all services and Solana settings
 */
export const config = {
    // Backend Services
    facilitatorUrl: import.meta.env.VITE_FACILITATOR_URL || 'http://localhost:8403',
    resourceServerUrl: import.meta.env.VITE_RESOURCE_SERVER_URL || 'http://localhost:8404',
    actionsApiUrl: import.meta.env.VITE_ACTIONS_API_URL || 'http://localhost:8405',

    // Supabase (Database)
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },

    // Solana Network
    solana: {
        network: (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta',
        rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    },

    // Token Mints
    tokens: {
        usdc: {
            devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
    },

    // Program IDs
    programs: {
        registry: import.meta.env.VITE_REGISTRY_PROGRAM_ID || 'SYNRegistry111111111111111111111111111111111',
        payments: import.meta.env.VITE_PAYMENTS_PROGRAM_ID || 'SYNPayments111111111111111111111111111111111',
        scheduler: import.meta.env.VITE_SCHEDULER_PROGRAM_ID || 'SYNScheduler11111111111111111111111111111111',
    },

    // Feature Flags
    features: {
        demoMode: import.meta.env.VITE_DEMO_MODE === 'true' || false,  // Demo mode disabled by default for real transactions
        enableIoT: true, // Enable IoT device control
        enableAI: true,  // Enable AI agents
        useSupabase: !!import.meta.env.VITE_SUPABASE_URL,  // Use Supabase if configured
    },
};

/**
 * Get USDC mint address for current network
 */
export function getUsdcMint(): string {
    return config.tokens.usdc[config.solana.network];
}

/**
 * Check if running in demo mode
 */
export function isDemoMode(): boolean {
    return config.features.demoMode;
}

export default config;
