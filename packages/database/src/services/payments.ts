import { getClient } from '../client';
import type { DbPayment, CreatePaymentInput, PaymentStatus } from '../types';

/**
 * Service for managing payments in the database
 */
export class PaymentService {
    private tableName = 'payments';

    /**
     * Create a new payment record
     */
    async create(input: CreatePaymentInput): Promise<DbPayment> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .insert({
                id: input.id,
                agent_id: input.agentId,
                payer_wallet: input.payerWallet,
                recipient_wallet: input.recipientWallet,
                amount: input.amount,
                status: 'pending' as PaymentStatus,
                network: input.network || 'devnet',
            })
            .select()
            .single();

        if (error) {
            console.error('[PaymentService] Error creating payment:', error);
            throw error;
        }

        return data;
    }

    /**
     * Get payment by ID
     */
    async getById(id: string): Promise<DbPayment | null> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('[PaymentService] Error fetching payment:', error);
            throw error;
        }

        return data;
    }

    /**
     * Get payments by payer wallet
     */
    async getByPayer(payerWallet: string, limit = 50): Promise<DbPayment[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('payer_wallet', payerWallet)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[PaymentService] Error fetching payments by payer:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get payments by recipient wallet
     */
    async getByRecipient(recipientWallet: string, limit = 50): Promise<DbPayment[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('recipient_wallet', recipientWallet)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[PaymentService] Error fetching payments by recipient:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get payments by agent
     */
    async getByAgent(agentId: string, limit = 100): Promise<DbPayment[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[PaymentService] Error fetching payments by agent:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Update payment status to completed
     */
    async complete(id: string, txSignature: string, slot: number): Promise<DbPayment> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .update({
                status: 'completed' as PaymentStatus,
                tx_signature: txSignature,
                slot: slot,
                completed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PaymentService] Error completing payment:', error);
            throw error;
        }

        return data;
    }

    /**
     * Update payment status to failed
     */
    async fail(id: string): Promise<DbPayment> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .update({
                status: 'failed' as PaymentStatus,
                completed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PaymentService] Error failing payment:', error);
            throw error;
        }

        return data;
    }

    /**
     * Update payment status to refunded
     */
    async refund(id: string, refundTxSignature: string): Promise<DbPayment> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .update({
                status: 'refunded' as PaymentStatus,
                completed_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PaymentService] Error refunding payment:', error);
            throw error;
        }

        return data;
    }

    /**
     * Get payment stats for a wallet
     */
    async getStats(wallet: string): Promise<{ totalSpent: number; totalEarned: number; totalTransactions: number }> {
        // Get spent (as payer)
        const { data: spentData } = await getClient()
            .from(this.tableName)
            .select('amount')
            .eq('payer_wallet', wallet)
            .eq('status', 'completed');

        const totalSpent = (spentData || []).reduce((sum, p) => sum + p.amount, 0);

        // Get earned (as recipient)
        const { data: earnedData } = await getClient()
            .from(this.tableName)
            .select('amount')
            .eq('recipient_wallet', wallet)
            .eq('status', 'completed');

        const totalEarned = (earnedData || []).reduce((sum, p) => sum + p.amount, 0);

        // Get total transactions
        const { count } = await getClient()
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .or(`payer_wallet.eq.${wallet},recipient_wallet.eq.${wallet}`);

        return {
            totalSpent,
            totalEarned,
            totalTransactions: count || 0,
        };
    }

    /**
     * Get recent payments for dashboard
     */
    async getRecent(limit = 10): Promise<DbPayment[]> {
        const { data, error } = await getClient()
            .from(this.tableName)
            .select('*')
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[PaymentService] Error fetching recent payments:', error);
            throw error;
        }

        return data || [];
    }
}

// Singleton instance
export const paymentService = new PaymentService();
