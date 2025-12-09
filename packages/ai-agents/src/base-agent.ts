import { z } from 'zod';

export interface AgentConfig {
    agentId: string;
    name: string;
    description: string;
    category: 'AI' | 'IoT' | 'Automation' | 'Utility' | 'Trading' | 'NFT';
    price: number;
    aiModel?: string;
    estimatedTime: number;
}

export interface TaskInput {
    taskId: string;
    params: Record<string, unknown>;
    paymentId: string;
    payer: string;
}

export interface TaskResult {
    taskId: string;
    status: 'completed' | 'failed';
    resultCid?: string;
    result?: unknown;
    error?: string;
    executionTime: number;
}

export abstract class BaseAgent {
    protected config: AgentConfig;
    protected inputSchema: z.ZodSchema;
    protected outputSchema: z.ZodSchema;

    constructor(config: AgentConfig, inputSchema: z.ZodSchema, outputSchema: z.ZodSchema) {
        this.config = config;
        this.inputSchema = inputSchema;
        this.outputSchema = outputSchema;
    }

    get agentId(): string {
        return this.config.agentId;
    }

    get name(): string {
        return this.config.name;
    }

    get price(): number {
        return this.config.price;
    }

    /**
     * Validate input parameters
     */
    validateInput(params: unknown): { valid: boolean; errors?: z.ZodError } {
        const result = this.inputSchema.safeParse(params);
        if (result.success) {
            return { valid: true };
        }
        return { valid: false, errors: result.error };
    }

    /**
     * Execute the agent task
     * Must be implemented by concrete agent classes
     */
    abstract execute(input: TaskInput): Promise<TaskResult>;

    /**
     * Get agent metadata for marketplace
     */
    getMetadata(): AgentConfig & { inputSchema: unknown; outputSchema: unknown } {
        return {
            ...this.config,
            inputSchema: this.inputSchema.describe,
            outputSchema: this.outputSchema.describe,
        };
    }
}

/**
 * Agent registry to store and manage agents
 */
export class AgentRegistry {
    private agents: Map<string, BaseAgent> = new Map();

    register(agent: BaseAgent): void {
        this.agents.set(agent.agentId, agent);
    }

    get(agentId: string): BaseAgent | undefined {
        return this.agents.get(agentId);
    }

    list(): BaseAgent[] {
        return Array.from(this.agents.values());
    }

    has(agentId: string): boolean {
        return this.agents.has(agentId);
    }
}

export const globalRegistry = new AgentRegistry();
