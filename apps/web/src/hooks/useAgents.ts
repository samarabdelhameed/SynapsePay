import { useState, useEffect, useCallback } from 'react';

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
}

/**
 * Hook for fetching and managing agents
 * 
 * @example
 * ```tsx
 * const { agents, loading, getAgentById } = useAgents('http://localhost:8404');
 * 
 * const pdfAgent = getAgentById('pdf-summarizer-v1');
 * ```
 */
export function useAgents(resourceServerUrl: string) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch agents from resource server
     */
    const fetchAgents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${resourceServerUrl}/agents`);

            if (!response.ok) {
                throw new Error(`Failed to fetch agents: ${response.statusText}`);
            }

            const data = await response.json();
            setAgents(data.agents || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agents';
            setError(errorMessage);

            // Fallback to default agents for demo
            setAgents(DEFAULT_AGENTS);
        } finally {
            setLoading(false);
        }
    }, [resourceServerUrl]);

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
        refetch: fetchAgents,
        getAgentById,
        getAgentsByCategory,
        searchAgents,
    };
}

/**
 * Default agents for demo mode
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
