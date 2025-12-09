import OpenAI from 'openai';
import { z } from 'zod';
import { BaseAgent, AgentConfig, TaskInput, TaskResult } from './base-agent';

export interface OpenAIProviderConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
}

export class OpenAIProvider {
    private client: OpenAI;
    private model: string;
    private maxTokens: number;

    constructor(config: OpenAIProviderConfig) {
        this.client = new OpenAI({ apiKey: config.apiKey });
        this.model = config.model || 'gpt-4-turbo-preview';
        this.maxTokens = config.maxTokens || 4096;
    }

    async chat(messages: OpenAI.ChatCompletionMessageParam[]): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages,
            max_tokens: this.maxTokens,
        });

        return response.choices[0]?.message?.content || '';
    }

    async analyze(prompt: string): Promise<string> {
        return this.chat([{ role: 'user', content: prompt }]);
    }
}

/**
 * PDF Summarizer Agent using OpenAI
 */
export class PDFSummarizerAgent extends BaseAgent {
    private provider: OpenAIProvider;

    constructor(apiKey: string) {
        super(
            {
                agentId: 'pdf-summarizer-v1',
                name: 'PDF Summarizer',
                description: 'Extract key points from PDF documents',
                category: 'AI',
                price: 50000, // 0.05 USDC
                aiModel: 'gpt-4-turbo-preview',
                estimatedTime: 5000,
            },
            z.object({
                text: z.string().describe('Extracted text from PDF'),
                maxTokens: z.number().optional().default(500),
                language: z.string().optional().default('en'),
            }),
            z.object({
                summary: z.string(),
                keyPoints: z.array(z.string()),
                wordCount: z.number(),
            })
        );

        this.provider = new OpenAIProvider({ apiKey });
    }

    async execute(input: TaskInput): Promise<TaskResult> {
        const startTime = Date.now();

        try {
            const params = input.params as { text: string; maxTokens?: number; language?: string };

            const prompt = `Summarize the following text and extract key points.
      
      Language: ${params.language || 'en'}
      Max tokens: ${params.maxTokens || 500}
      
      Text:
      ${params.text}
      
      Please provide:
      1. A concise summary
      2. Key bullet points
      3. Word count of original text`;

            const response = await this.provider.analyze(prompt);

            return {
                taskId: input.taskId,
                status: 'completed',
                result: {
                    summary: response,
                    keyPoints: [], // TODO: Parse from response
                    wordCount: params.text.split(/\s+/).length,
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

/**
 * Code Debugger Agent using OpenAI
 */
export class CodeDebuggerAgent extends BaseAgent {
    private provider: OpenAIProvider;

    constructor(apiKey: string) {
        super(
            {
                agentId: 'code-debugger-v1',
                name: 'Code Debugger',
                description: 'Analyze and fix code issues',
                category: 'AI',
                price: 80000, // 0.08 USDC
                aiModel: 'gpt-4-turbo-preview',
                estimatedTime: 8000,
            },
            z.object({
                code: z.string().describe('Code to analyze'),
                language: z.string().describe('Programming language'),
                errorMessage: z.string().optional(),
            }),
            z.object({
                analysis: z.string(),
                fixedCode: z.string(),
                explanation: z.string(),
            })
        );

        this.provider = new OpenAIProvider({ apiKey });
    }

    async execute(input: TaskInput): Promise<TaskResult> {
        const startTime = Date.now();

        try {
            const params = input.params as { code: string; language: string; errorMessage?: string };

            const prompt = `Analyze and fix the following ${params.language} code.
      
      ${params.errorMessage ? `Error message: ${params.errorMessage}` : ''}
      
      Code:
      \`\`\`${params.language}
      ${params.code}
      \`\`\`
      
      Please provide:
      1. Analysis of the issue
      2. Fixed code
      3. Explanation of changes`;

            const response = await this.provider.analyze(prompt);

            return {
                taskId: input.taskId,
                status: 'completed',
                result: {
                    analysis: response,
                    fixedCode: '', // TODO: Parse from response
                    explanation: '',
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
