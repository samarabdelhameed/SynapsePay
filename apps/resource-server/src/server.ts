import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'resource-server',
        timestamp: new Date().toISOString(),
    });
});

// List all agents
app.get('/agents', async (c) => {
    const agents = [
        {
            agentId: 'pdf-summarizer-v1',
            name: 'PDF Summarizer',
            category: 'AI',
            price: '50000',
            description: 'Extract key points from PDF documents',
        },
        {
            agentId: 'image-editor-v1',
            name: 'Image Editor',
            category: 'AI',
            price: '100000',
            description: 'Remove background, resize, apply filters',
        },
        {
            agentId: 'code-debugger-v1',
            name: 'Code Debugger',
            category: 'AI',
            price: '80000',
            description: 'Analyze and fix code issues',
        },
    ];

    return c.json({ agents });
});

// Get agent details
app.get('/agent/:agentId', async (c) => {
    const agentId = c.req.param('agentId');

    return c.json({
        agentId,
        name: 'Agent Name',
        description: 'Agent description',
        category: 'AI',
        price: '50000',
        estimatedTime: 5000,
    });
});

// Execute agent (requires X-PAYMENT header)
app.post('/agent/execute', async (c) => {
    const paymentHeader = c.req.header('X-PAYMENT');

    if (!paymentHeader) {
        return c.json({ error: 'Payment Required' }, 402);
    }

    const body = await c.req.json();
    const taskId = crypto.randomUUID();

    // TODO: Validate payment
    // TODO: Execute agent
    // TODO: Store result on IPFS

    return c.json({
        taskId,
        status: 'executing',
        estimatedTime: 5000,
    });
});

// Get task status
app.get('/task/:taskId', async (c) => {
    const taskId = c.req.param('taskId');

    return c.json({
        taskId,
        status: 'completed',
        resultCid: 'QmExample...',
    });
});

// Get result from IPFS
app.get('/result/:cid', async (c) => {
    const cid = c.req.param('cid');

    return c.json({
        cid,
        result: { message: 'Result data' },
    });
});

// Device command (IoT)
app.post('/device/command', async (c) => {
    const paymentHeader = c.req.header('X-PAYMENT');

    if (!paymentHeader) {
        return c.json({ error: 'Payment Required' }, 402);
    }

    const body = await c.req.json();

    return c.json({
        success: true,
        deviceId: body.deviceId,
        command: body.command,
        response: 'Command executed',
    });
});

const port = parseInt(process.env.RESOURCE_SERVER_PORT || '8404');

console.log(`🤖 Resource Server starting on port ${port}...`);

export default {
    port,
    fetch: app.fetch,
};
