import { Hono } from 'hono';
// import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Inline X402 functions (avoiding package import issues)
function createPayload(params: {
    paymentId: string;
    payer: string;
    recipient: string;
    amount: string;
    tokenMint: string;
    agentId: string;
    network: 'mainnet-beta' | 'devnet' | 'localnet';
    taskMetadata?: Record<string, unknown>;
    expirySeconds?: number;
}) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (params.expirySeconds || 300);
    return {
        version: '1.0' as const,
        paymentType: 'solana' as const,
        network: params.network,
        payload: {
            paymentId: params.paymentId,
            payer: params.payer,
            recipient: params.recipient,
            amount: params.amount,
            tokenMint: params.tokenMint,
            agentId: params.agentId,
            taskMetadata: params.taskMetadata,
            expiresAt,
            nonce: now,
        },
    };
}

function encodePayload(payload: ReturnType<typeof createPayload>): string {
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString('base64');
}

export const invoiceRoutes = new Hono();

// Agent prices (in USDC lamports, 6 decimals)
const AGENT_PRICES: Record<string, number> = {
    'pdf-summarizer-v1': 50000,      // 0.05 USDC
    'image-editor-v1': 100000,       // 0.10 USDC
    'nft-minter-v1': 250000,         // 0.25 USDC
    'code-debugger-v1': 80000,       // 0.08 USDC
    'ugv-rover-01': 100000,          // 0.10 USDC
    'smart-led-array': 50000,        // 0.05 USDC
};

// Agent recipients (owner wallets)  
const AGENT_RECIPIENTS: Record<string, string> = {
    'pdf-summarizer-v1': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    'image-editor-v1': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    'nft-minter-v1': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    'code-debugger-v1': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    'ugv-rover-01': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    'smart-led-array': 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
};

const USDC_MINTS = {
    devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
} as const;

const CreateInvoiceSchema = z.object({
    agentId: z.string(),
    amount: z.string().optional(),
    payer: z.string(),
    taskMetadata: z.record(z.unknown()).optional(),
});

invoiceRoutes.post('/', async (c) => {
    const body = await c.req.json();

    // Get agent price (use provided or lookup from prices)
    let amount = body.amount ? parseInt(body.amount) : AGENT_PRICES[body.agentId];

    if (!amount) {
        return c.json({ error: 'Unknown agent or missing amount' }, 404);
    }

    const recipient = AGENT_RECIPIENTS[body.agentId] || process.env.FACILITATOR_WALLET || 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH';
    const network = (process.env.SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta';

    // Generate unique payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 300; // 5 minutes

    // Create X402 payment payload
    const payload = createPayload({
        paymentId,
        payer: body.payer,
        recipient,
        amount: amount.toString(),
        agentId: body.agentId,
        tokenMint: USDC_MINTS[network],
        network,
        taskMetadata: body.taskMetadata,
        expirySeconds: 300,
    });

    const invoice = {
        invoiceId: paymentId,
        agentId: body.agentId,
        amount: amount.toString(),
        amountDisplay: `${(amount / 1_000_000).toFixed(2)} USDC`,
        currency: 'USDC',
        payer: body.payer,
        recipient,
        network,
        expiresAt: payload.payload.expiresAt,
        createdAt: now,
        // X402 specific
        paymentPayload: payload,
        xPaymentHeader: encodePayload(payload),
    };

    return c.json(invoice, 201);
});

invoiceRoutes.get('/:invoiceId', async (c) => {
    const invoiceId = c.req.param('invoiceId');

    // TODO: Fetch invoice from Redis/DB
    return c.json({
        invoiceId,
        status: 'pending',
        message: 'Invoice lookup - for demo, all invoices are valid',
    });
});
