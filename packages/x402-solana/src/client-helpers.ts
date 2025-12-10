import { PublicKey } from '@solana/web3.js';
import { createPayload, encodePayload } from './payload';
import { createSigningMessage } from './signatures';

/**
 * Parameters for creating X402 payment header
 */
export interface CreateX402HeaderParams {
    /** Wallet with signMessage capability */
    wallet: {
        publicKey: PublicKey | null;
        signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
    };
    /** Recipient wallet address */
    recipient: string;
    /** Amount in USDC (not lamports) */
    amountUsdc: number;
    /** Duration in seconds */
    durationSeconds: number;
    /** Agent or device ID */
    agentId: string;
    /** Solana network */
    network: 'devnet' | 'mainnet-beta';
    /** USDC token mint address */
    usdcMint: string;
    /** Optional task metadata */
    taskMetadata?: Record<string, unknown>;
}

/**
 * Result from creating X402 payment header
 */
export interface X402PaymentResult {
    /** Base64 encoded payment header */
    paymentHeader: string;
    /** Unique payment ID */
    paymentId: string;
    /** Full payload object */
    payload: ReturnType<typeof createPayload>;
}

/**
 * Generate a unique payment ID
 */
function generatePaymentId(payer: string, agentId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const combined = `${payer.slice(0, 8)}-${agentId.slice(0, 8)}-${timestamp}-${random}`;
    // Convert to base58-like string (alphanumeric)
    return combined.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

/**
 * Create X402 payment header for Solana
 * 
 * This is the main function for the frontend to create payment headers.
 * The user only needs to sign ONE message (payment intent).
 * 
 * @example
 * ```typescript
 * const { paymentHeader, paymentId } = await createX402PaymentHeader({
 *   wallet: wallet,
 *   recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
 *   amountUsdc: 0.05,
 *   durationSeconds: 600,
 *   agentId: 'pdf-summarizer-v1',
 *   network: 'devnet',
 *   usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
 * });
 * ```
 */
export async function createX402PaymentHeader(
    params: CreateX402HeaderParams
): Promise<X402PaymentResult> {
    const {
        wallet,
        recipient,
        amountUsdc,
        durationSeconds,
        agentId,
        network,
        usdcMint,
        taskMetadata,
    } = params;

    // Validate wallet connection
    if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
    }

    if (!wallet.signMessage) {
        throw new Error('Wallet does not support message signing');
    }

    const payer = wallet.publicKey.toBase58();

    // Generate unique payment ID
    const paymentId = generatePaymentId(payer, agentId);

    // Convert amount to USDC lamports (6 decimals)
    const amountLamports = Math.floor(amountUsdc * 1_000_000);

    // Create nonce for replay protection
    const nonce = Date.now();

    // Create the payment intent message for signing
    const tempPayload = {
        paymentId,
        payer,
        recipient,
        amount: amountLamports.toString(),
        tokenMint: usdcMint,
        agentId,
        expiresAt: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
        nonce,
    };
    const intentMessage = createSigningMessage(tempPayload);

    // User signs the intent (only ONE signature needed on Solana!)
    const signatureBytes = await wallet.signMessage(intentMessage);

    // Convert signature to base64
    const signatureBase64 = Buffer.from(signatureBytes).toString('base64');


    // Create the full payload
    const payload = createPayload({
        paymentId,
        payer,
        recipient,
        amount: amountLamports.toString(),
        agentId,
        tokenMint: usdcMint,
        network,
        expirySeconds: 300,
        taskMetadata: {
            ...taskMetadata,
            durationSeconds,
        },
    });

    // Add signature to payload
    payload.payload.paymentIntentSignature = {
        signature: signatureBase64,
        nonce,
    };

    // Encode payload to Base64 for X-PAYMENT header
    const paymentHeader = encodePayload(payload);

    return {
        paymentHeader,
        paymentId,
        payload,
    };
}

/**
 * Fetch with automatic 402 handling
 * 
 * Makes a request and automatically handles 402 Payment Required
 * by creating and attaching payment headers.
 * 
 * @example
 * ```typescript
 * const response = await fetchWithX402(
 *   'http://localhost:8404/agent/execute',
 *   { method: 'POST', body: JSON.stringify({ agentId: 'pdf-summarizer-v1' }) },
 *   paymentParams
 * );
 * ```
 */
export async function fetchWithX402(
    url: string,
    options: RequestInit = {},
    paymentParams: CreateX402HeaderParams
): Promise<Response> {
    // First, try without payment
    const initialResponse = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    // If not 402, return as-is
    if (initialResponse.status !== 402) {
        return initialResponse;
    }

    // 402 received - create payment header
    const { paymentHeader } = await createX402PaymentHeader(paymentParams);

    // Retry with payment header
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            'X-PAYMENT': paymentHeader,
        },
    });
}

/**
 * USDC mint addresses for different networks
 */
export const USDC_MINTS = {
    devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
} as const;

/**
 * Get USDC mint for a network
 */
export function getUsdcMint(network: 'devnet' | 'mainnet-beta'): string {
    return USDC_MINTS[network];
}
