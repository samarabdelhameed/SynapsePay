import { Hono } from 'hono';
// import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createFacilitatorFromEnv } from '../facilitator';

export const settleRoutes = new Hono();

// Initialize facilitator
const facilitator = createFacilitatorFromEnv();

const SettlePaymentSchema = z.object({
    payment: z.string(), // Base64 encoded X-PAYMENT payload
});

settleRoutes.post('/', async (c) => {
    const body = await c.req.json();

    try {
        const result = await facilitator.settlePayment(body.payment);

        if (!result.success) {
            return c.json({
                success: false,
                error: result.error,
            }, 400);
        }

        return c.json({
            success: true,
            mode: result.mode,
            txSignature: result.txSignature,
            slot: result.slot,
            settledAt: new Date().toISOString(),
        });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Settlement failed',
        }, 500);
    }
});

// Check settlement status
settleRoutes.get('/:paymentId', async (c) => {
    const paymentId = c.req.param('paymentId');

    // TODO: Query on-chain state for payment status

    return c.json({
        paymentId,
        status: 'pending',
        demoMode: facilitator.isDemoMode(),
    });
});
