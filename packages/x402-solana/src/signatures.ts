import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { SolanaPaymentPayload, PaymentSignature } from './types';

/**
 * Sign a payment intent message
 */
export function signPaymentIntent(
    payload: SolanaPaymentPayload,
    keypair: Keypair
): PaymentSignature {
    const message = createSigningMessage(payload);
    const signature = nacl.sign.detached(message, keypair.secretKey);

    return {
        signature: bs58.encode(signature),
        publicKey: keypair.publicKey.toBase58(),
    };
}

/**
 * Verify a payment signature
 */
export function verifyPaymentSignature(
    payload: SolanaPaymentPayload,
    signature: PaymentSignature
): boolean {
    try {
        const message = createSigningMessage(payload);
        const signatureBytes = bs58.decode(signature.signature);
        const publicKeyBytes = bs58.decode(signature.publicKey);

        return nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
    } catch {
        return false;
    }
}

/**
 * Create a deterministic message for signing
 */
export function createSigningMessage(payload: SolanaPaymentPayload): Uint8Array {
    const message = [
        'SynapsePay Payment Intent',
        `PaymentID: ${payload.paymentId}`,
        `Payer: ${payload.payer}`,
        `Recipient: ${payload.recipient}`,
        `Amount: ${payload.amount}`,
        `Token: ${payload.tokenMint}`,
        `Agent: ${payload.agentId}`,
        `Expires: ${payload.expiresAt}`,
        `Nonce: ${payload.nonce}`,
    ].join('\n');

    return new TextEncoder().encode(message);
}

/**
 * Verify that a public key signed a message
 */
export function verifySignature(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: PublicKey
): boolean {
    try {
        return nacl.sign.detached.verify(message, signature, publicKey.toBytes());
    } catch {
        return false;
    }
}

/**
 * Generate a new keypair for testing
 */
export function generateKeypair(): Keypair {
    return Keypair.generate();
}

/**
 * Restore keypair from base58 secret key
 */
export function keypairFromSecret(secretKey: string): Keypair {
    return Keypair.fromSecretKey(bs58.decode(secretKey));
}
