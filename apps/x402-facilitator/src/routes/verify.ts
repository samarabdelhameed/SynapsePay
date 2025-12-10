import { Hono } from 'hono';
// import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createFacilitatorFromEnv } from '../facilitator';

export const verifyRoutes = new Hono();

// Initialize facilitator
const facilitator = createFacilitatorFromEnv();

const VerifyPaymentSchema = z.object({
    payment: z.string(), // Base64 encoded X-PAYMENT payload
});

verifyRoutes.post('/', async (c) => {
    const body = await c.req.json();

    try {
        const result = await facilitator.verifyPayment(body.payment);

        if (!result.valid) {
            return c.json({
                valid: false,
                error: result.error,
            }, 400);
        }

        return c.json({
            valid: true,
            paymentId: result.paymentId,
            payer: result.payer,
            recipient: result.recipient,
            amount: result.amount,
            agentId: result.agentId,
        });
    } catch (error) {
        return c.json({
            valid: false,
            error: error instanceof Error ? error.message : 'Verification failed',
        }, 500);
    }
});
