import { decodePayload, validatePayload, extractPaymentHeader } from './payload';
import { X402PaymentPayload, PaymentSignature } from './types';

export interface X402MiddlewareContext {
    payload: X402PaymentPayload;
    signature?: PaymentSignature;
    isValid: boolean;
    errors: string[];
}

/**
 * Parse and validate X-PAYMENT header
 * Works with any HTTP framework (Express, Hono, etc.)
 */
export function parseX402Header(
    headers: Record<string, string | undefined>
): X402MiddlewareContext | null {
    const paymentHeader = extractPaymentHeader(headers);

    if (!paymentHeader) {
        return null;
    }

    try {
        const payload = decodePayload(paymentHeader);
        const validation = validatePayload(payload);

        return {
            payload,
            isValid: validation.valid,
            errors: validation.errors,
        };
    } catch (error) {
        return {
            payload: null as any,
            isValid: false,
            errors: [`Failed to parse X-PAYMENT header: ${error}`],
        };
    }
}

/**
 * Create x402 required response headers
 */
export function createX402Response(params: {
    invoiceId: string;
    amount: string;
    recipient: string;
    agentId: string;
    network: string;
    expiresAt: number;
}): Record<string, string> {
    return {
        'X-Payment-Required': 'true',
        'X-Payment-Invoice': params.invoiceId,
        'X-Payment-Amount': params.amount,
        'X-Payment-Currency': 'USDC',
        'X-Payment-Recipient': params.recipient,
        'X-Payment-Agent': params.agentId,
        'X-Payment-Network': params.network,
        'X-Payment-Expires': params.expiresAt.toString(),
    };
}

/**
 * Check if request requires payment
 */
export function requiresPayment(statusCode: number): boolean {
    return statusCode === 402;
}

/**
 * Hono middleware factory for x402 payment verification
 */
export function createX402Middleware(options: {
    facilitatorUrl: string;
    onPaymentRequired?: (agentId: string) => Promise<{
        amount: string;
        recipient: string;
    }>;
}) {
    return async (c: any, next: () => Promise<void>) => {
        const paymentContext = parseX402Header(c.req.header());

        if (paymentContext && paymentContext.isValid) {
            c.set('x402', paymentContext);
            return next();
        }

        // If no valid payment, return 402
        if (options.onPaymentRequired) {
            const agentId = c.req.param('agentId') || 'unknown';
            const { amount, recipient } = await options.onPaymentRequired(agentId);

            const headers = createX402Response({
                invoiceId: crypto.randomUUID(),
                amount,
                recipient,
                agentId,
                network: 'devnet',
                expiresAt: Math.floor(Date.now() / 1000) + 300,
            });

            return c.json(
                { error: 'Payment Required', message: 'X-PAYMENT header required' },
                402,
                headers
            );
        }

        return c.json({ error: 'Payment Required' }, 402);
    };
}
