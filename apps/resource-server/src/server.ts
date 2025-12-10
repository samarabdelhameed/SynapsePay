import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-PAYMENT'],
}));

// Health check (no payment required)
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'resource-server',
        timestamp: new Date().toISOString(),
    });
});

// List all agents (no payment required)
app.get('/agents', (c) => {
    return c.json({
        agents: [
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
                id: 'code-debugger-v1',
                name: 'Code Debugger',
                description: 'AI-powered code analysis and bug detection',
                price: 80000,
                priceDisplay: '0.08 USDC',
                category: 'AI',
                rating: 4.7,
                totalRuns: 520,
                icon: '🐛',
            },
            {
                id: 'ugv-rover-01',
                name: 'UGV Rover 01',
                description: 'Control physical robot with live camera feed',
                price: 100000,
                priceDisplay: '0.10 USDC',
                category: 'IoT',
                duration: 600, // 10 minutes
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
                duration: 300, // 5 minutes
                rating: 4.5,
                totalRuns: 180,
                icon: '💡',
            },
        ],
    });
});

// Get agent details
app.get('/agent/:agentId', async (c) => {
    const agentId = c.req.param('agentId');
    // In production: fetch from database
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
        return c.json({
            error: 'Payment Required',
            code: 402,
            message: 'X-PAYMENT header is required',
            pricing: {
                'pdf-summarizer-v1': '0.05 USDC',
                'image-editor-v1': '0.10 USDC',
                'nft-minter-v1': '0.25 USDC',
            },
        }, 402);
    }

    // Parse payment and validate
    let payment;
    try {
        const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
        payment = JSON.parse(decoded);
    } catch {
        return c.json({ error: 'Invalid payment header' }, 400);
    }

    const body = await c.req.json();
    const { agentId, taskParams } = body;

    console.log(`[Resource] Executing agent: ${agentId}`);
    console.log(`[Resource] Payment: ${payment.payload?.amount} from ${payment.payload?.payer}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return mock result based on agent
    let result;
    switch (agentId) {
        case 'pdf-summarizer-v1':
            result = {
                summary: 'This document discusses the key aspects of decentralized automation infrastructure...',
                keyPoints: [
                    'X402 protocol enables gasless micropayments',
                    'Solana provides 400ms block times for instant settlement',
                    'AI agents can be monetized per-use without subscriptions',
                    'IoT devices can be controlled with USDC micropayments',
                ],
                wordCount: 2450,
                readingTime: '10 min',
            };
            break;
        case 'nft-minter-v1':
            result = {
                mintAddress: 'NFT' + Math.random().toString(36).slice(2, 10).toUpperCase(),
                metadataUri: 'https://arweave.net/example-metadata-' + Date.now(),
                explorerUrl: 'https://explorer.solana.com/address/...',
                collection: 'SynapsePay AI Art',
            };
            break;
        case 'code-debugger-v1':
            result = {
                bugs: [
                    { line: 42, severity: 'warning', message: 'Unused variable' },
                    { line: 87, severity: 'error', message: 'Possible null reference' },
                ],
                suggestions: ['Add null checks', 'Use TypeScript strict mode'],
                quality: 'B+',
            };
            break;
        default:
            result = {
                success: true,
                message: `Agent ${agentId} executed successfully`,
                timestamp: new Date().toISOString(),
            };
    }

    return c.json({
        taskId: `task_${Date.now()}`,
        status: 'completed',
        result,
        executionTime: 2000,
        payment: {
            amount: payment.payload?.amount,
            payer: payment.payload?.payer,
            verified: true,
        },
    });
});

// Device command (for IoT)
app.post('/device/command', async (c) => {
    const paymentHeader = c.req.header('X-PAYMENT');

    if (!paymentHeader) {
        return c.json({
            error: 'Payment Required',
            code: 402,
            message: 'X-PAYMENT header is required for device control',
        }, 402);
    }

    const body = await c.req.json();
    const { deviceId, command, params } = body;

    console.log(`[Device] Command: ${command} to ${deviceId}`);

    // Simulate device response
    return c.json({
        success: true,
        deviceId,
        command,
        response: 'ACK',
        timestamp: new Date().toISOString(),
        sessionExpires: Date.now() + 600000, // 10 min session
    });
});

// Get task status
app.get('/task/:taskId', async (c) => {
    const taskId = c.req.param('taskId');
    return c.json({
        taskId,
        status: 'completed',
        resultCid: 'Qm' + Math.random().toString(36).slice(2, 20),
    });
});

const port = parseInt(process.env.RESOURCE_SERVER_PORT || '8404');

console.log(`🤖 Resource Server starting on port ${port}...`);

export default {
    port,
    fetch: app.fetch,
};
