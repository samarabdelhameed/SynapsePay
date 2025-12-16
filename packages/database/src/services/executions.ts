import { getClient } from '../client';
import type { DbExecution, CreateExecutionInput, ExecutionStatus } from '../types';

/**
 * Service for managing executions in the database
 */
export class ExecutionService {
    private tableName = 'executions';

    /**
     * Create a new execution record
     */
    async create(input: CreateExecutionInput): Promise<DbExecution> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .insert({
                id: input.id,
                payment_id: input.paymentId,
                agent_id: input.agentId,
                input_data: input.inputData || null,
                status: 'pending' as ExecutionStatus,
            })
            .select()
            .single();

        if (error) {
            console.error('[ExecutionService] Error creating execution:', error);
            throw error;
        }

        return data;
    }

    /**
     * Get execution by ID
     */
    async getById(id: string): Promise<DbExecution | null> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('[ExecutionService] Error fetching execution:', error);
            throw error;
        }

        return data;
    }

    /**
     * Get execution by payment ID
     */
    async getByPayment(paymentId: string): Promise<DbExecution | null> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('payment_id', paymentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('[ExecutionService] Error fetching execution by payment:', error);
            throw error;
        }

        return data;
    }

    /**
     * Mark execution as running
     */
    async start(id: string): Promise<DbExecution> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .update({
                status: 'running' as ExecutionStatus,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[ExecutionService] Error starting execution:', error);
            throw error;
        }

        return data;
    }

    /**
     * Complete execution with result
     */
    async complete(
        id: string,
        outputData: Record<string, unknown>,
        resultCid?: string,
        executionTimeMs?: number
    ): Promise<DbExecution> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .update({
                status: 'completed' as ExecutionStatus,
                output_data: outputData,
                result_cid: resultCid || null,
                execution_time_ms: executionTimeMs || null,
                completed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[ExecutionService] Error completing execution:', error);
            throw error;
        }

        return data;
    }

    /**
     * Fail execution with error
     */
    async fail(id: string, errorMessage: string): Promise<DbExecution> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .update({
                status: 'failed' as ExecutionStatus,
                error_message: errorMessage,
                completed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[ExecutionService] Error failing execution:', error);
            throw error;
        }

        return data;
    }

    /**
     * Get executions by agent
     */
    async getByAgent(agentId: string, limit = 50): Promise<DbExecution[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[ExecutionService] Error fetching executions by agent:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get recent executions
     */
    async getRecent(limit = 10): Promise<DbExecution[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[ExecutionService] Error fetching recent executions:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get execution stats
     */
    async getStats(): Promise<{ total: number; completed: number; failed: number; avgExecutionTime: number }> {
        const { count: total } = await getClient()
            .from(this.tableName)
            .select('*', { count: 'exact', head: true });

        const { count: completed } = await getClient()
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        const { count: failed } = await getClient()
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('status', 'failed');

        const { data: timeData } = await getClient()
            .from(this.tableName)
            .select('execution_time_ms')
            .eq('status', 'completed')
            .not('execution_time_ms', 'is', null);

        const avgExecutionTime = timeData && timeData.length > 0
            ? timeData.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / timeData.length
            : 0;

        return {
            total: total || 0,
            completed: completed || 0,
            failed: failed || 0,
            avgExecutionTime: Math.round(avgExecutionTime),
        };
    }
}

// Singleton instance
export const executionService = new ExecutionService();
