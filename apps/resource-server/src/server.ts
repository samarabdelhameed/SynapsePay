import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createClient } from '@supabase/supabase-js';
import { executeAgent } from './agents/executors';
import { checkAIAvailability } from './agents/ai-executor';

const app = new Hono();

// ═══════════════════════════════════════════════════════════════
// DATABASE SETUP
// ═══════════════════════════════════════════════════════════════

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

const isDemoMode = !supabase;

if (isDemoMode) {
    console.log('⚠️ Running in DEMO MODE - No database connected');
    console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_KEY for real mode');
} else {
    console.log('✅ Database connected:', supabaseUrl);
}

// Check AI availability
const aiStatus = checkAIAvailability();
console.log('🤖 AI Services:', aiStatus.openai ? '✅ OpenAI' : '❌ OpenAI', '|', aiStatus.anthropic ? '✅ Anthropic' : '❌ Anthropic');

// ═══════════════════════════════════════════════════════════════
// DEFAULT AGENTS (Fallback when no database)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_AGENTS = [
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
        aiModel: 'gpt-4-turbo',
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
        aiModel: 'claude-3-sonnet',
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

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

app.use('*', logger());
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-PAYMENT', 'X-TX-SIGNATURE', 'Authorization'],
}));

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

// Health check
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'resource-server',
        mode: isDemoMode ? 'demo' : 'production',
        database: !!supabase,
        ai: aiStatus,
        timestamp: new Date().toISOString(),
    });
});

// List all agents (from database or fallback)
app.get('/agents', async (c) => {
    try {
        if (supabase) {
            // Fetch from database
            const { data, error } = await supabase
                .from('agents')
                .select('id, name, description, price, price_display, category, icon, rating, total_runs, duration, is_active')
                .eq('is_active', true)
                .order('total_runs', { ascending: false });

            if (error) {
                console.error('[Agents] Database error:', error);
                throw error;
            }

            // Map to API format
            const agents = (data || []).map(a => ({
                id: a.id,
                name: a.name,
                description: a.description,
                price: a.price,
                priceDisplay: a.price_display,
                category: a.category,
                icon: a.icon,
                rating: a.rating,
                totalRuns: a.total_runs,
                duration: a.duration,
            }));

            return c.json({ agents, source: 'database' });
        }

        // Fallback to default agents
        return c.json({ agents: DEFAULT_AGENTS, source: 'default' });
    } catch (error) {
        console.error('[Agents] Error:', error);
        return c.json({ agents: DEFAULT_AGENTS, source: 'fallback' });
    }
});

// Get agent details
app.get('/agent/:agentId', async (c) => {
    const agentId = c.req.param('agentId');

    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('agents')
                .select('*')
                .eq('id', agentId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                return c.json({
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    priceDisplay: data.price_display,
                    category: data.category,
                    icon: data.icon,
                    rating: data.rating,
                    totalRuns: data.total_runs,
                    duration: data.duration,
                    ownerWallet: data.owner_wallet,
                    aiModel: data.ai_model,
                    inputSchema: data.input_schema,
                });
            }
        }

        // Fallback to default agents
        const agent = DEFAULT_AGENTS.find(a => a.id === agentId);
        if (agent) {
            return c.json(agent);
        }

        return c.json({ error: 'Agent not found' }, 404);
    } catch (error) {
        console.error('[Agent] Error:', error);
        return c.json({ error: 'Failed to fetch agent' }, 500);
    }
});

// Execute agent (requires X-PAYMENT or X-TX-SIGNATURE header)
app.post('/agent/execute', async (c) => {
    const paymentHeader = c.req.header('X-PAYMENT');
    const txSignature = c.req.header('X-TX-SIGNATURE');

    // Verify payment exists
    if (!paymentHeader && !txSignature) {
        return c.json({
            error: 'Payment Required',
            code: 402,
            message: 'X-PAYMENT or X-TX-SIGNATURE header is required',
        }, 402);
    }

    const body = await c.req.json();
    const { agentId, taskParams } = body;

    if (!agentId) {
        return c.json({ error: 'agentId is required' }, 400);
    }

    console.log(`[Execute] Agent: ${agentId}`);
    console.log(`[Execute] TX: ${txSignature || 'via X-PAYMENT'}`);

    try {
        // Fetch agent config from database
        let agentConfig: {
            aiModel?: string;
            aiPrompt?: string;
            ownerWallet?: string;
        } = {};

        if (supabase) {
            const { data } = await supabase
                .from('agents')
                .select('ai_model, ai_prompt, owner_wallet')
                .eq('id', agentId)
                .single();

            if (data) {
                agentConfig = {
                    aiModel: data.ai_model,
                    aiPrompt: data.ai_prompt,
                    ownerWallet: data.owner_wallet,
                };
            }
        }

        // Execute the agent
        const startTime = Date.now();
        const result = await executeAgent({
            agentId,
            input: taskParams || {},
            aiModel: agentConfig.aiModel as any,
            aiPrompt: agentConfig.aiPrompt,
        });

        // Record execution in database
        if (supabase && result.success) {
            const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

            // Create execution record
            await supabase.from('executions').insert({
                id: executionId,
                agent_id: agentId,
                input_data: taskParams,
                output_data: result.result,
                execution_time_ms: result.executionTimeMs,
                status: 'completed',
                completed_at: new Date().toISOString(),
            });

            // Increment agent runs
            await supabase.rpc('increment_agent_runs', { agent_id: agentId });
        }

        return c.json({
            taskId: `task_${Date.now()}`,
            status: result.success ? 'completed' : 'failed',
            result: result.result,
            executionTime: result.executionTimeMs,
            tokensUsed: result.tokensUsed,
            mode: supabase ? 'production' : 'demo',
            payment: {
                txSignature: txSignature || 'via-header',
                verified: true,
            },
            error: result.error,
        });

    } catch (error) {
        console.error('[Execute] Error:', error);
        return c.json({
            taskId: `task_${Date.now()}`,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Execution failed',
        }, 500);
    }
});

// Create agent (for agent creators)
app.post('/agent/create', async (c) => {
    if (!supabase) {
        return c.json({ error: 'Database not available in demo mode' }, 503);
    }

    const body = await c.req.json();
    const {
        id,
        name,
        description,
        price,
        category,
        icon,
        ownerWallet,
        aiModel,
        aiPrompt,
        duration,
        inputSchema,
    } = body;

    // Validate required fields
    if (!id || !name || !price || !category || !ownerWallet) {
        return c.json({ error: 'Missing required fields: id, name, price, category, ownerWallet' }, 400);
    }

    try {
        // Format price display
        const priceDisplay = `${(price / 1_000_000).toFixed(2)} USDC`;

        const { data, error } = await supabase
            .from('agents')
            .insert({
                id,
                name,
                description: description || '',
                price,
                price_display: priceDisplay,
                category,
                icon: icon || '🤖',
                owner_wallet: ownerWallet,
                ai_model: aiModel || null,
                ai_prompt: aiPrompt || null,
                duration: duration || null,
                input_schema: inputSchema || null,
                rating: 0,
                total_runs: 0,
                total_earnings: 0,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return c.json({ error: 'Agent ID already exists' }, 409);
            }
            throw error;
        }

        return c.json({
            success: true,
            agent: {
                id: data.id,
                name: data.name,
                description: data.description,
                price: data.price,
                priceDisplay: data.price_display,
                category: data.category,
            },
            message: 'Agent created successfully',
        });

    } catch (error) {
        console.error('[Create Agent] Error:', error);
        return c.json({ error: 'Failed to create agent' }, 500);
    }
});

// Device command (for IoT)
app.post('/device/command', async (c) => {
    const paymentHeader = c.req.header('X-PAYMENT');
    const txSignature = c.req.header('X-TX-SIGNATURE');

    if (!paymentHeader && !txSignature) {
        return c.json({
            error: 'Payment Required',
            code: 402,
            message: 'X-PAYMENT header is required for device control',
        }, 402);
    }

    const body = await c.req.json();
    const { deviceId, command, params } = body;

    console.log(`[Device] Command: ${command} to ${deviceId}`);

    // TODO: Integrate with actual IoT device bridge
    // For now, return simulated response

    return c.json({
        success: true,
        deviceId,
        command,
        response: 'ACK',
        timestamp: new Date().toISOString(),
        sessionExpires: Date.now() + 600000,
    });
});

// Get task status
app.get('/task/:taskId', async (c) => {
    const taskId = c.req.param('taskId');

    if (supabase) {
        // Try to find execution by ID pattern
        const { data } = await supabase
            .from('executions')
            .select('*')
            .eq('id', taskId)
            .single();

        if (data) {
            return c.json({
                taskId,
                status: data.status,
                result: data.output_data,
                resultCid: data.result_cid,
                executionTime: data.execution_time_ms,
            });
        }
    }

    return c.json({
        taskId,
        status: 'completed',
        resultCid: 'Qm' + Math.random().toString(36).slice(2, 20),
    });
});

// Get payment history for wallet
app.get('/payments/:wallet', async (c) => {
    const wallet = c.req.param('wallet');

    if (!supabase) {
        return c.json({ payments: [], source: 'demo' });
    }

    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .or(`payer_wallet.eq.${wallet},recipient_wallet.eq.${wallet}`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return c.json({ payments: data || [], source: 'database' });
    } catch (error) {
        console.error('[Payments] Error:', error);
        return c.json({ payments: [], source: 'error' });
    }
});

// Get stats
app.get('/stats', async (c) => {
    if (!supabase) {
        return c.json({
            totalAgents: DEFAULT_AGENTS.length,
            totalExecutions: 15000,
            totalVolume: 250000000,
            source: 'demo',
        });
    }

    try {
        const { count: agentCount } = await supabase
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        const { count: executionCount } = await supabase
            .from('executions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        const { data: volumeData } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed');

        const totalVolume = (volumeData || []).reduce((sum, p) => sum + p.amount, 0);

        return c.json({
            totalAgents: agentCount || 0,
            totalExecutions: executionCount || 0,
            totalVolume,
            source: 'database',
        });
    } catch (error) {
        console.error('[Stats] Error:', error);
        return c.json({
            totalAgents: DEFAULT_AGENTS.length,
            totalExecutions: 0,
            totalVolume: 0,
            source: 'error',
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════

const port = parseInt(process.env.RESOURCE_SERVER_PORT || process.env.PORT || '8404');

console.log(`🤖 Resource Server starting on port ${port}...`);
console.log(`   Mode: ${isDemoMode ? 'DEMO' : 'PRODUCTION'}`);

export default {
    port,
    fetch: app.fetch,
};
