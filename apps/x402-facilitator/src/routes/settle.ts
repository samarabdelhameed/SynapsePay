import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const settleRoutes = new Hono();

const SettlePaymentSchema = z.object({
    invoiceId: z.string(),
    txSignature: z.string(),
});

settleRoutes.post('/', zValidator('json', SettlePaymentSchema), async (c) => {
    const body = c.req.valid('json');

    try {
        // TODO: Verify transaction on Solana
        // TODO: Confirm payment received
        // TODO: Update invoice status

        return c.json({
            settled: true,
            invoiceId: body.invoiceId,
            txSignature: body.txSignature,
            settledAt: new Date().toISOString(),
        });
    } catch (error) {
        return c.json({
            settled: false,
            error: error instanceof Error ? error.message : 'Settlement failed',
        }, 400);
    }
});

// Check settlement status
settleRoutes.get('/:invoiceId', async (c) => {
    const invoiceId = c.req.param('invoiceId');

    // TODO: Fetch settlement status from DB

    return c.json({
        invoiceId,
        status: 'pending',
    });
});
