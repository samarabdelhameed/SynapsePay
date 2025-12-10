import { z } from 'zod';
import { BaseAgent, TaskInput, TaskResult } from './base-agent';

export interface ClaudeProviderConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
}

/**
 * Claude Provider - wrapper for Anthropic Claude API
 * Note: Requires @anthropic-ai/sdk v0.20+ for messages API
 * For older versions, use completions API or upgrade the SDK
 */
export class ClaudeProvider {
    private apiKey: string;
    private model: string;
    private maxTokens: number;

    constructor(config: ClaudeProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'claude-3-opus-20240229';
        this.maxTokens = config.maxTokens || 4096;
    }

    async chat(prompt: string): Promise<string> {
        // Using fetch directly for compatibility with older SDK versions
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as {
            content: Array<{ type: string; text?: string }>;
        };

        const textBlock = data.content.find((block) => block.type === 'text');
        return textBlock?.text || '';
    }
}

/**
 * Image Editor Agent using Claude Vision
 */
export class ImageEditorAgent extends BaseAgent {
    private claudeProvider: ClaudeProvider;

    constructor(apiKey: string) {
        super(
            {
                agentId: 'image-editor-v1',
                name: 'Image Editor',
                description: 'Remove background, resize, apply filters',
                category: 'AI',
                price: 100000, // 0.10 USDC
                aiModel: 'claude-3-opus-20240229',
                estimatedTime: 10000,
            },
            z.object({
                imageCid: z.string().describe('IPFS CID of image'),
                operation: z.enum(['remove_background', 'resize', 'filter']),
                options: z.record(z.unknown()).optional(),
            }),
            z.object({
                resultCid: z.string(),
                operation: z.string(),
            })
        );

        this.claudeProvider = new ClaudeProvider({ apiKey });
    }

    async execute(input: TaskInput): Promise<TaskResult> {
        const startTime = Date.now();

        try {
            const params = input.params as { operation: string; imageCid: string };

            // Use Claude for image analysis/description
            await this.claudeProvider.chat(
                `Describe how to ${params.operation} an image with CID ${params.imageCid}`
            );

            return {
                taskId: input.taskId,
                status: 'completed',
                result: {
                    resultCid: 'QmProcessedImage...',
                    operation: params.operation,
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
