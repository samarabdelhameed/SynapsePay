import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const invoiceRoutes = new Hono();

const CreateInvoiceSchema = z.object({
    agentId: z.string(),
    amount: z.string(),
    payer: z.string(),
});

invoiceRoutes.post('/', zValidator('json', CreateInvoiceSchema), async (c) => {
    const body = c.req.valid('json');

    // Generate invoice ID
    const invoiceId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 300; // 5 minutes

    const invoice = {
        invoiceId,
        agentId: body.agentId,
        amount: body.amount,
        currency: 'USDC',
        payer: body.payer,
        recipient: process.env.FACILITATOR_WALLET || 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        network: process.env.SOLANA_NETWORK || 'devnet',
        expiresAt,
        createdAt: now,
    };

    // TODO: Store invoice in Redis/DB

    return c.json(invoice, 201);
});

invoiceRoutes.get('/:invoiceId', async (c) => {
    const invoiceId = c.req.param('invoiceId');

    // TODO: Fetch invoice from Redis/DB

    return c.json({
        invoiceId,
        status: 'pending',
        message: 'Invoice lookup not implemented yet',
    });
});
