import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

/**
 * AI Executor - Handles real AI model execution
 */

// Initialize clients (lazy loading)
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

function getOpenAI(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not configured');
        }
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

function getAnthropic(): Anthropic {
    if (!anthropicClient) {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY not configured');
        }
        anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return anthropicClient;
}

export type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';

export interface AIExecutionResult {
    success: boolean;
    output: unknown;
    model: string;
    tokensUsed?: number;
    executionTimeMs: number;
    error?: string;
}

/**
 * Execute AI model with given prompt and input
 */
export async function executeAI(
    model: AIModel,
    systemPrompt: string,
    userInput: string,
    maxTokens = 4096
): Promise<AIExecutionResult> {
    const startTime = Date.now();

    try {
        // Route to appropriate provider
        if (model.startsWith('gpt')) {
            return await executeOpenAI(model, systemPrompt, userInput, maxTokens, startTime);
        } else if (model.startsWith('claude')) {
            return await executeAnthropic(model, systemPrompt, userInput, maxTokens, startTime);
        } else {
            throw new Error(`Unsupported model: ${model}`);
        }
    } catch (error) {
        const executionTimeMs = Date.now() - startTime;
        return {
            success: false,
            output: null,
            model,
            executionTimeMs,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Execute OpenAI models (GPT-4, GPT-3.5, etc.)
 */
async function executeOpenAI(
    model: string,
    systemPrompt: string,
    userInput: string,
    maxTokens: number,
    startTime: number
): Promise<AIExecutionResult> {
    const openai = getOpenAI();

    const modelMap: Record<string, string> = {
        'gpt-4': 'gpt-4',
        'gpt-4-turbo': 'gpt-4-turbo-preview',
        'gpt-3.5-turbo': 'gpt-3.5-turbo',
    };

    const completion = await openai.chat.completions.create({
        model: modelMap[model] || model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
    });

    const executionTimeMs = Date.now() - startTime;
    const output = completion.choices[0]?.message?.content || '';

    return {
        success: true,
        output: parseAIOutput(output),
        model,
        tokensUsed: completion.usage?.total_tokens,
        executionTimeMs,
    };
}

/**
 * Execute Anthropic models (Claude 3, etc.)
 */
async function executeAnthropic(
    model: string,
    systemPrompt: string,
    userInput: string,
    maxTokens: number,
    startTime: number
): Promise<AIExecutionResult> {
    const anthropic = getAnthropic();

    const modelMap: Record<string, string> = {
        'claude-3-opus': 'claude-3-opus-20240229',
        'claude-3-sonnet': 'claude-3-sonnet-20240229',
        'claude-3-haiku': 'claude-3-haiku-20240307',
    };

    const message = await anthropic.messages.create({
        model: modelMap[model] || model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
            { role: 'user', content: userInput },
        ],
    });

    const executionTimeMs = Date.now() - startTime;
    const output = message.content[0]?.type === 'text' ? message.content[0].text : '';

    return {
        success: true,
        output: parseAIOutput(output),
        model,
        tokensUsed: message.usage?.input_tokens + message.usage?.output_tokens,
        executionTimeMs,
    };
}

/**
 * Parse AI output - try to extract JSON if present
 */
function parseAIOutput(output: string): unknown {
    // Try to parse as JSON first
    try {
        // Look for JSON blocks
        const jsonMatch = output.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }

        // Try parsing the whole output as JSON
        return JSON.parse(output);
    } catch {
        // Return as-is if not JSON
        return output;
    }
}

/**
 * Check if AI services are available
 */
export function checkAIAvailability(): { openai: boolean; anthropic: boolean } {
    return {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
    };
}
