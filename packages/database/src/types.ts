/**
 * Database Types for SynapsePay
 */

export type AgentCategory = 'AI' | 'IoT' | 'Automation' | 'Utility' | 'Trading' | 'NFT';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'llama-3' | 'custom';

/**
 * Agent stored in database
 */
export interface DbAgent {
    id: string;
    name: string;
    description: string;
    price: number; // in USDC base units (6 decimals)
    price_display: string;
    category: AgentCategory;
    icon: string;
    owner_wallet: string;
    ai_model: AIModel | null;
    ai_prompt: string | null;
    api_endpoint: string | null; // For custom agents
    rating: number;
    total_runs: number;
    total_earnings: number;
    is_active: boolean;
    duration: number | null; // For IoT devices (seconds)
    input_schema: Record<string, unknown> | null; // JSON schema for inputs
    created_at: string;
    updated_at: string;
}

/**
 * Payment record in database
 */
export interface DbPayment {
    id: string;
    agent_id: string;
    payer_wallet: string;
    recipient_wallet: string;
    amount: number;
    status: PaymentStatus;
    tx_signature: string | null;
    slot: number | null;
    network: 'devnet' | 'mainnet-beta';
    created_at: string;
    completed_at: string | null;
}

/**
 * Execution record in database
 */
export interface DbExecution {
    id: string;
    payment_id: string;
    agent_id: string;
    input_data: Record<string, unknown> | null;
    output_data: Record<string, unknown> | null;
    result_cid: string | null; // IPFS CID
    execution_time_ms: number | null;
    status: ExecutionStatus;
    error_message: string | null;
    created_at: string;
    completed_at: string | null;
}

/**
 * User stats
 */
export interface DbUserStats {
    wallet_address: string;
    total_spent: number;
    total_executions: number;
    favorite_agents: string[];
    created_at: string;
}

/**
 * Agent with computed fields for API response
 */
export interface Agent extends Omit<DbAgent, 'price' | 'price_display' | 'total_earnings' | 'created_at' | 'updated_at' | 'ai_prompt' | 'api_endpoint'> {
    priceDisplay: string;
    price: number;
}

/**
 * Create agent input
 */
export interface CreateAgentInput {
    id: string;
    name: string;
    description: string;
    price: number;
    category: AgentCategory;
    icon: string;
    ownerWallet: string;
    aiModel?: AIModel;
    aiPrompt?: string;
    duration?: number;
    inputSchema?: Record<string, unknown>;
}

/**
 * Create payment input
 */
export interface CreatePaymentInput {
    id: string;
    agentId: string;
    payerWallet: string;
    recipientWallet: string;
    amount: number;
    network?: 'devnet' | 'mainnet-beta';
}

/**
 * Create execution input
 */
export interface CreateExecutionInput {
    id: string;
    paymentId: string;
    agentId: string;
    inputData?: Record<string, unknown>;
}
