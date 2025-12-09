import bs58 from 'bs58';
import { X402PaymentPayload, SolanaPaymentPayload } from './types';

const X402_VERSION = '1.0' as const;

/**
 * Encode a payment payload to base64 for X-PAYMENT header
 */
export function encodePayload(payload: X402PaymentPayload): string {
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString('base64');
}

/**
 * Decode a base64 X-PAYMENT header to payload
 */
export function decodePayload(encoded: string): X402PaymentPayload {
    const json = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(json);
}

/**
 * Create a Solana payment payload
 */
export function createPayload(params: {
    paymentId: string;
    payer: string;
    recipient: string;
    amount: string;
    tokenMint: string;
    agentId: string;
    network: 'mainnet-beta' | 'devnet' | 'localnet';
    taskMetadata?: Record<string, unknown>;
    expirySeconds?: number;
}): X402PaymentPayload {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (params.expirySeconds || 300);

    return {
        version: X402_VERSION,
        paymentType: 'solana',
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

/**
 * Validate a payment payload
 */
export function validatePayload(payload: X402PaymentPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (payload.version !== X402_VERSION) {
        errors.push(`Invalid version: expected ${X402_VERSION}, got ${payload.version}`);
    }

    if (payload.paymentType !== 'solana') {
        errors.push(`Invalid payment type: expected solana, got ${payload.paymentType}`);
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.payload.expiresAt < now) {
        errors.push('Payment payload has expired');
    }

    if (!payload.payload.paymentId) {
        errors.push('Missing paymentId');
    }

    if (!payload.payload.payer) {
        errors.push('Missing payer');
    }

    if (!payload.payload.recipient) {
        errors.push('Missing recipient');
    }

    if (!payload.payload.amount || BigInt(payload.payload.amount) <= 0n) {
        errors.push('Invalid amount');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Extract X-PAYMENT header from request headers
 */
export function extractPaymentHeader(headers: Record<string, string | undefined>): string | null {
    return headers['x-payment'] || headers['X-PAYMENT'] || headers['X-Payment'] || null;
}
