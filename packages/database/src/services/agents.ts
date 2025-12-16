import { getClient } from '../client';
import type { DbAgent, Agent, CreateAgentInput, AgentCategory } from '../types';

/**
 * Service for managing agents in the database
 */
export class AgentService {
    private tableName = 'agents';

    /**
     * Get all active agents
     */
    async getAll(): Promise<Agent[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('is_active', true)
            .order('total_runs', { ascending: false });

        if (error) {
            console.error('[AgentService] Error fetching agents:', error);
            throw error;
        }

        return (data || []).map(this.mapToAgent);
    }

    /**
     * Get agent by ID
     */
    async getById(id: string): Promise<Agent | null> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            console.error('[AgentService] Error fetching agent:', error);
            throw error;
        }

        return data ? this.mapToAgent(data) : null;
    }

    /**
     * Get agents by category
     */
    async getByCategory(category: AgentCategory): Promise<Agent[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('rating', { ascending: false });

        if (error) {
            console.error('[AgentService] Error fetching agents by category:', error);
            throw error;
        }

        return (data || []).map(this.mapToAgent);
    }

    /**
     * Get agents by owner wallet
     */
    async getByOwner(ownerWallet: string): Promise<Agent[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('owner_wallet', ownerWallet)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[AgentService] Error fetching agents by owner:', error);
            throw error;
        }

        return (data || []).map(this.mapToAgent);
    }

    /**
     * Search agents by name or description
     */
    async search(query: string): Promise<Agent[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .order('total_runs', { ascending: false })
            .limit(20);

        if (error) {
            console.error('[AgentService] Error searching agents:', error);
            throw error;
        }

        return (data || []).map(this.mapToAgent);
    }

    /**
     * Create a new agent
     */
    async create(input: CreateAgentInput): Promise<Agent> {
        const priceDisplay = this.formatPrice(input.price);

        const { data, error } = await getClient()
            .from(this.tableName)
            .insert({
                id: input.id,
                name: input.name,
                description: input.description,
                price: input.price,
                price_display: priceDisplay,
                category: input.category,
                icon: input.icon,
                owner_wallet: input.ownerWallet,
                ai_model: input.aiModel || null,
                ai_prompt: input.aiPrompt || null,
                duration: input.duration || null,
                input_schema: input.inputSchema || null,
                rating: 0,
                total_runs: 0,
                total_earnings: 0,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('[AgentService] Error creating agent:', error);
            throw error;
        }

        return this.mapToAgent(data);
    }

    /**
     * Increment agent runs and update rating
     */
    async incrementRuns(id: string, newRating?: number): Promise<void> {
        const agent = await this.getById(id);
        if (!agent) {
            throw new Error(`Agent not found: ${id}`);
        }

        // Calculate new average rating if provided
        let updateData: Record<string, unknown> = {
            total_runs: agent.totalRuns + 1,
            updated_at: new Date().toISOString(),
        };

        if (newRating !== undefined) {
            // Weighted average of existing rating and new rating
            const newAvgRating = (agent.rating * agent.totalRuns + newRating) / (agent.totalRuns + 1);
            updateData.rating = Math.round(newAvgRating * 100) / 100;
        }

        const { error } = await getClient()
            .from(this.tableName)
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('[AgentService] Error incrementing runs:', error);
            throw error;
        }
    }

    /**
     * Add earnings to agent
     */
    async addEarnings(id: string, amount: number): Promise<void> {
        const { error } = await getClient().rpc('increment_agent_earnings', {
            agent_id: id,
            earning_amount: amount,
        });

        // Fallback if RPC not available
        if (error) {
            const { data: agent } = await getClient()
                .from(this.tableName)
                .select('total_earnings')
                .eq('id', id)
                .single();

            if (agent) {
                await getClient()
                    .from(this.tableName)
                    .update({
                        total_earnings: (agent.total_earnings || 0) + amount,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id);
            }
        }
    }

    /**
     * Deactivate an agent
     */
    async deactivate(id: string, ownerWallet: string): Promise<void> {
        const { error } = await getClient()
            .from(this.tableName)
            .update({
                is_active: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('owner_wallet', ownerWallet);

        if (error) {
            console.error('[AgentService] Error deactivating agent:', error);
            throw error;
        }
    }

    /**
     * Get full agent details including AI config (for execution)
     */
    async getFullDetails(id: string): Promise<DbAgent | null> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    }

    /**
     * Format price from base units to display string
     */
    private formatPrice(priceInBaseUnits: number): string {
        const usdc = priceInBaseUnits / 1_000_000;
        return `${usdc.toFixed(2)} USDC`;
    }

    /**
     * Map database record to API response
     */
    private mapToAgent(dbAgent: DbAgent): Agent {
        return {
            id: dbAgent.id,
            name: dbAgent.name,
            description: dbAgent.description,
            price: dbAgent.price,
            priceDisplay: dbAgent.price_display,
            category: dbAgent.category,
            icon: dbAgent.icon,
            owner_wallet: dbAgent.owner_wallet,
            ai_model: dbAgent.ai_model,
            rating: dbAgent.rating,
            totalRuns: dbAgent.total_runs,
            is_active: dbAgent.is_active,
            duration: dbAgent.duration,
            input_schema: dbAgent.input_schema,
        };
    }
}

// Singleton instance
export const agentService = new AgentService();
