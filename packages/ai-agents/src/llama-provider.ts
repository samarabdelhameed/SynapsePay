import { z } from 'zod';
import { BaseAgent, TaskInput, TaskResult } from './base-agent';

export interface LlamaProviderConfig {
    baseUrl: string;
    model?: string;
}

export class LlamaProvider {
    private baseUrl: string;
    private model: string;

    constructor(config: LlamaProviderConfig) {
        this.baseUrl = config.baseUrl;
        this.model = config.model || 'llama2';
    }

    async generate(prompt: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
            }),
        });

        const data = await response.json();
        return data.response || '';
    }
}

/**
 * Trading Signals Agent using local Llama
 */
export class TradingSignalAgent extends BaseAgent {
    private provider: LlamaProvider;

    constructor(baseUrl: string) {
        super(
            {
                agentId: 'trading-signal-v1',
                name: 'Trading Signals',
                description: 'Get AI-powered trading signals',
                category: 'Trading',
                price: 200000, // 0.20 USDC
                aiModel: 'llama2',
                estimatedTime: 15000,
            },
            z.object({
                token: z.string().describe('Token symbol'),
                timeframe: z.enum(['1h', '4h', '1d', '1w']),
            }),
            z.object({
                signal: z.enum(['buy', 'sell', 'hold']),
                confidence: z.number(),
                analysis: z.string(),
            })
        );

        this.provider = new LlamaProvider({ baseUrl });
    }

    async execute(input: TaskInput): Promise<TaskResult> {
        const startTime = Date.now();

        try {
            const params = input.params as { token: string; timeframe: string };

            const prompt = `Analyze ${params.token} for ${params.timeframe} timeframe.
      Provide a trading signal (buy/sell/hold), confidence level, and brief analysis.`;

            const response = await this.provider.generate(prompt);

            return {
                taskId: input.taskId,
                status: 'completed',
                result: {
                    signal: 'hold',
                    confidence: 0.65,
                    analysis: response,
                },
                executionTime: Date.now() - startTime,
            };
        } catch (error) {
            return {
                taskId: input.taskId,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime: Date.now() - startTime,
            };
        }
    }
}
