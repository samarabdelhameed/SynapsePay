import { useState, useEffect, useCallback } from 'react';
import { config } from '../config/endpoints';
import { getSupabase, isSupabaseAvailable } from '../config/supabase';

/**
 * Agent information
 */
export interface Agent {
    id: string;
    name: string;
    description: string;
    price: number;
    priceDisplay: string;
    category: 'AI' | 'IoT' | 'Automation' | 'Utility' | 'Trading' | 'NFT';
    rating: number;
    totalRuns: number;
    duration?: number;
    icon?: string;
    ownerWallet?: string;
    aiModel?: string;
    inputSchema?: Record<string, unknown>;
}

/**
 * Default agents for demo mode fallback
 */
const DEFAULT_AGENTS: Agent[] = [
    {
        id: 'pdf-summarizer-v1',
        name: 'PDF Summarizer',
        description: 'AI-powered PDF summary extraction with key points',
        price: 50000,
        priceDisplay: '0.05 USDC',
        category: 'AI',
        rating: 4.8,
        totalRuns: 1250,
        icon: '📄',
    },
    {
        id: 'image-editor-v1',
        name: 'Image Editor',
        description: 'Remove background, resize, apply filters',
        price: 100000,
        priceDisplay: '0.10 USDC',
        category: 'AI',
        rating: 4.6,
        totalRuns: 890,
        icon: '🎨',
    },
    {
        id: 'nft-minter-v1',
        name: 'NFT Minter',
        description: 'Generate and mint NFT from image on Solana',
        price: 250000,
        priceDisplay: '0.25 USDC',
        category: 'NFT',
        rating: 4.9,
        totalRuns: 650,
        icon: '🖼️',
    },
    {
        id: 'code-debugger-v1',
        name: 'Code Debugger',
        description: 'AI-powered code analysis and bug detection',
        price: 80000,
        priceDisplay: '0.08 USDC',
        category: 'AI',
        rating: 4.7,
        totalRuns: 520,
        icon: '🐛',
    },
    {
        id: 'ugv-rover-01',
        name: 'UGV Rover 01',
        description: 'Control physical robot with live camera feed',
        price: 100000,
        priceDisplay: '0.10 USDC',
        category: 'IoT',
        duration: 600,
        rating: 4.7,
        totalRuns: 320,
        icon: '🤖',
    },
    {
        id: 'smart-led-array',
        name: 'Smart LED Array',
        description: 'Control RGB LED matrix display remotely',
        price: 50000,
        priceDisplay: '0.05 USDC',
        category: 'IoT',
        duration: 300,
        rating: 4.5,
        totalRuns: 180,
        icon: '💡',
    },
];

/**
 * Hook for fetching and managing agents
 * Tries: 1) Supabase, 2) Resource Server, 3) Default fallback
 */
export function useAgents() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<'supabase' | 'server' | 'default'>('default');

    /**
     * Fetch agents from Supabase
     */
    const fetchFromSupabase = async (): Promise<Agent[] | null> => {
        const supabase = getSupabase();
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('agents')
                .select('id, name, description, price, price_display, category, icon, rating, total_runs, duration, owner_wallet, ai_model, input_schema')
                .eq('is_active', true)
                .order('total_runs', { ascending: false });

            if (error) throw error;

            return (data || []).map(a => ({
                id: a.id,
                name: a.name,
                description: a.description,
                price: a.price,
                priceDisplay: a.price_display,
                category: a.category as Agent['category'],
                icon: a.icon,
                rating: a.rating,
                totalRuns: a.total_runs,
                duration: a.duration,
                ownerWallet: a.owner_wallet,
                aiModel: a.ai_model,
                inputSchema: a.input_schema,
            }));
        } catch (err) {
            console.error('[useAgents] Supabase error:', err);
            return null;
        }
    };

    /**
     * Fetch agents from Resource Server
     */
    const fetchFromServer = async (): Promise<Agent[] | null> => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${config.resourceServerUrl}/agents`, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Server error');

            const data = await response.json();
            return data.agents || [];
        } catch (err) {
            console.error('[useAgents] Server error:', err);
            return null;
        }
    };

    /**
     * Fetch agents with fallback chain
     */
    const fetchAgents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Try Supabase first (if configured)
            if (isSupabaseAvailable()) {
                const supabaseAgents = await fetchFromSupabase();
                if (supabaseAgents && supabaseAgents.length > 0) {
                    setAgents(supabaseAgents);
                    setSource('supabase');
                    setLoading(false);
                    console.log('[useAgents] Loaded from Supabase:', supabaseAgents.length);
                    return;
                }
            }

            // Try Resource Server
            const serverAgents = await fetchFromServer();
            if (serverAgents && serverAgents.length > 0) {
                setAgents(serverAgents);
                setSource('server');
                setLoading(false);
                console.log('[useAgents] Loaded from server:', serverAgents.length);
                return;
            }

            // Fallback to defaults
            console.log('[useAgents] Using default agents');
            setAgents(DEFAULT_AGENTS);
            setSource('default');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agents';
            setError(errorMessage);
            setAgents(DEFAULT_AGENTS);
            setSource('default');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    /**
     * Get agent by ID
     */
    const getAgentById = useCallback((id: string): Agent | undefined => {
        return agents.find(agent => agent.id === id);
    }, [agents]);

    /**
     * Get agents by category
     */
    const getAgentsByCategory = useCallback((category: Agent['category']): Agent[] => {
        return agents.filter(agent => agent.category === category);
    }, [agents]);

    /**
     * Search agents by name or description
     */
    const searchAgents = useCallback((query: string): Agent[] => {
        const lowerQuery = query.toLowerCase();
        return agents.filter(agent =>
            agent.name.toLowerCase().includes(lowerQuery) ||
            agent.description.toLowerCase().includes(lowerQuery)
        );
    }, [agents]);

    return {
        agents,
        loading,
        error,
        source,
        refetch: fetchAgents,
        getAgentById,
        getAgentsByCategory,
        searchAgents,
        isRealData: source !== 'default',
    };
}

export default useAgents;
