import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

const app = new Hono();

// Configuration
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const USDC_MINT = new PublicKey(
    process.env.USDC_MINT_ADDRESS || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
);

// Agent configurations
const AGENT_CONFIG: Record<string, { price: number; recipient: string; name: string; description: string }> = {
    'pdf-summarizer-v1': {
        price: 50000, // 0.05 USDC (6 decimals)
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'PDF Summarizer',
        description: 'AI-powered PDF summary extraction with key points',
    },
    'image-editor-v1': {
        price: 100000, // 0.10 USDC
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'Image Editor',
        description: 'Remove background, resize, apply filters',
    },
    'nft-minter-v1': {
        price: 250000, // 0.25 USDC
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'NFT Minter',
        description: 'Generate and mint NFT from image on Solana',
    },
    'code-debugger-v1': {
        price: 80000, // 0.08 USDC
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'Code Debugger',
        description: 'AI-powered code analysis and bug detection',
    },
    'ugv-rover-01': {
        price: 100000, // 0.10 USDC
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'UGV Rover Control',
        description: 'Control physical robot with live camera feed',
    },
    'smart-led-array': {
        price: 50000, // 0.05 USDC
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'Smart LED Array',
        description: 'Control RGB LED matrix display remotely',
    },
};

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept', 'Accept-Encoding'],
}));

// Actions manifest (required for Solana Actions)
app.get('/actions.json', (c) => {
    return c.json({
        rules: [
            {
                pathPattern: '/api/actions/**',
                apiPath: '/api/actions/**',
            },
        ],
    });
});

// Get action metadata (GET request for Blinks)
app.get('/api/actions/:agentId', async (c) => {
    const agentId = c.req.param('agentId');
    const agent = AGENT_CONFIG[agentId];

    if (!agent) {
        return c.json({ error: 'Agent not found' }, 404);
    }

    const priceUsdc = (agent.price / 1_000_000).toFixed(2);

    return c.json({
        icon: 'https://synapsepay.io/icon.png',
        title: agent.name,
        description: `${agent.description} - Pay ${priceUsdc} USDC`,
        label: `Pay ${priceUsdc} USDC`,
        links: {
            actions: [
                {
                    label: `Run ${agent.name} (${priceUsdc} USDC)`,
                    href: `/api/actions/${agentId}`,
                },
            ],
        },
    });
});

// Execute action (POST - creates transaction)
app.post('/api/actions/:agentId', async (c) => {
    try {
        const agentId = c.req.param('agentId');
        const body = await c.req.json();

        // Get user's wallet from the request (Solana Actions standard)
        const userAccount = body.account;

        if (!userAccount) {
            return c.json({ error: 'Missing account in request body' }, 400);
        }

        const agent = AGENT_CONFIG[agentId];
        if (!agent) {
            return c.json({ error: 'Agent not found' }, 404);
        }

        const userPubkey = new PublicKey(userAccount);
        const recipientPubkey = new PublicKey(agent.recipient);

        // Connect to Solana
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

        // Get associated token accounts
        const userTokenAccount = await getAssociatedTokenAddress(
            USDC_MINT,
            userPubkey
        );
        const recipientTokenAccount = await getAssociatedTokenAddress(
            USDC_MINT,
            recipientPubkey
        );

        // Create transfer instruction for USDC
        const transferInstruction = createTransferInstruction(
            userTokenAccount,
            recipientTokenAccount,
            userPubkey,
            agent.price,
            [],
            TOKEN_PROGRAM_ID
        );

        // Create transaction
        const transaction = new Transaction();
        transaction.add(transferInstruction);

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = userPubkey;

        // Serialize transaction (partially signed - user will complete)
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        });

        const base64Transaction = serializedTransaction.toString('base64');

        console.log(`[Actions API] Generated transaction for ${agentId}`);
        console.log(`[Actions API] Payer: ${userAccount}`);
        console.log(`[Actions API] Amount: ${agent.price / 1_000_000} USDC`);

        return c.json({
            transaction: base64Transaction,
            message: `Pay ${(agent.price / 1_000_000).toFixed(2)} USDC to run ${agent.name}`,
        });
    } catch (error) {
        console.error('[Actions API] Error generating transaction:', error);
        return c.json({
            error: 'Failed to generate transaction',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// Generate Blink URL
app.get('/blink/:agentId', async (c) => {
    const agentId = c.req.param('agentId');
    const agent = AGENT_CONFIG[agentId];

    if (!agent) {
        return c.json({ error: 'Agent not found' }, 404);
    }

    const baseUrl = process.env.ACTIONS_BASE_URL || 'http://localhost:8405';
    const blinkUrl = `solana-action:${baseUrl}/api/actions/${agentId}`;
    const priceUsdc = (agent.price / 1_000_000).toFixed(2);

    return c.json({
        agentId,
        name: agent.name,
        price: `${priceUsdc} USDC`,
        blinkUrl,
        embedUrl: `https://dial.to/?action=${encodeURIComponent(blinkUrl)}`,
        shareUrl: `https://twitter.com/intent/tweet?text=Run%20${encodeURIComponent(agent.name)}%20with%20SynapsePay!%20Pay%20${priceUsdc}%20USDC%20per%20use.&url=${encodeURIComponent(blinkUrl)}`,
    });
});

// List all available agents
app.get('/agents', (c) => {
    const agents = Object.entries(AGENT_CONFIG).map(([id, config]) => ({
        id,
        name: config.name,
        description: config.description,
        price: config.price,
        priceDisplay: `${(config.price / 1_000_000).toFixed(2)} USDC`,
    }));

    return c.json({ agents });
});

// Health check
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'actions-api',
        version: '1.0.0',
        solanaNetwork: process.env.SOLANA_NETWORK || 'devnet',
        timestamp: new Date().toISOString(),
    });
});

const port = parseInt(process.env.ACTIONS_API_PORT || '8405');

console.log(`⚡ Actions API starting on port ${port}...`);
console.log(`   RPC: ${SOLANA_RPC_URL}`);
console.log(`   USDC Mint: ${USDC_MINT.toBase58()}`);

export default {
    port,
    fetch: app.fetch,
};
