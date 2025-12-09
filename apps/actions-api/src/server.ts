import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Actions manifest (required for Solana Actions)
app.get('/actions.json', (c) => {
    return c.json({
        rules: [
            {
                pathPattern: '/api/actions/*',
                apiPath: '/api/actions/*',
            },
        ],
    });
});

// Get action metadata
app.get('/api/actions/:agentId', async (c) => {
    const agentId = c.req.param('agentId');

    return c.json({
        icon: 'https://synapsepay.io/icon.png',
        title: `Run ${agentId}`,
        description: 'Execute AI agent task with SynapsePay',
        label: 'Run Agent',
        links: {
            actions: [
                {
                    label: 'Execute Task',
                    href: `/api/actions/${agentId}`,
                },
            ],
        },
    });
});

// Execute action (POST)
app.post('/api/actions/:agentId', async (c) => {
    const agentId = c.req.param('agentId');
    const body = await c.req.json();

    // TODO: Generate Solana transaction for the action

    return c.json({
        transaction: 'base64_encoded_transaction',
        message: `Executing ${agentId}`,
    });
});

// Generate Blink URL
app.get('/blink/:agentId', async (c) => {
    const agentId = c.req.param('agentId');
    const baseUrl = process.env.ACTIONS_BASE_URL || 'http://localhost:8405';

    const blinkUrl = `solana-action:${baseUrl}/api/actions/${agentId}`;

    return c.json({
        agentId,
        blinkUrl,
        shareUrl: `https://twitter.com/intent/tweet?text=Try%20this%20AI%20agent!&url=${encodeURIComponent(blinkUrl)}`,
    });
});

// Health check
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'actions-api',
        timestamp: new Date().toISOString(),
    });
});

const port = parseInt(process.env.ACTIONS_API_PORT || '8405');

console.log(`⚡ Actions API starting on port ${port}...`);

export default {
    port,
    fetch: app.fetch,
};
