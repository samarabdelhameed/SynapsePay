import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const verifyRoutes = new Hono();

const VerifyPaymentSchema = z.object({
    payload: z.string(),
    signature: z.string(),
    publicKey: z.string(),
});

verifyRoutes.post('/', zValidator('json', VerifyPaymentSchema), async (c) => {
    const body = c.req.valid('json');

    try {
        // Decode payload
        const payloadJson = Buffer.from(body.payload, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);

        // TODO: Verify Ed25519 signature
        // TODO: Check nonce hasn't been used
        // TODO: Check expiry

        return c.json({
            valid: true,
            paymentId: payload.payload?.paymentId,
            amount: payload.payload?.amount,
        });
    } catch (error) {
        return c.json({
            valid: false,
            errors: [error instanceof Error ? error.message : 'Verification failed'],
        }, 400);
    }
});
