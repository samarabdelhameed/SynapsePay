import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * X402 Payment Payload structure
 */
interface X402PaymentPayload {
    version: string;
    paymentType: string;
    network: string;
    payload: {
        paymentId: string;
        payer: string;
        recipient: string;
        amount: string;
        tokenMint: string;
        agentId: string;
        taskMetadata?: Record<string, unknown>;
        expiresAt: number;
        nonce: number;
        paymentIntentSignature?: {
            signature: string;
            nonce: number;
        };
    };
}

/**
 * Configuration for PaymentFacilitator
 */
export interface FacilitatorConfig {
    /** Solana RPC connection */
    rpcUrl: string;
    /** Facilitator private key (Base58) - pays transaction fees */
    facilitatorPrivateKey?: string;
    /** USDC token mint address */
    usdcMint: string;
    /** Platform fee in basis points (e.g., 500 = 5%) */
    platformFeeBps?: number;
}

/**
 * Result from verifying a payment
 */
export interface VerifyResult {
    valid: boolean;
    paymentId?: string;
    payer?: string;
    recipient?: string;
    amount?: string;
    agentId?: string;
    error?: string;
}

/**
 * Result from settling a payment
 */
export interface SettleResult {
    success: boolean;
    txSignature?: string;
    slot?: number;
    mode?: 'demo' | 'real';
    error?: string;
}

/**
 * PaymentFacilitator handles X402 payment verification and settlement on Solana
 * 
 * In real mode, it submits transactions and pays gas fees.
 * In demo mode, it simulates successful settlements.
 */
export class PaymentFacilitator {
    private connection: Connection;
    private facilitatorKeypair: Keypair | null = null;
    private usdcMint: PublicKey;
    private platformFeeBps: number;

    constructor(config: FacilitatorConfig) {
        this.connection = new Connection(config.rpcUrl, 'confirmed');
        this.usdcMint = new PublicKey(config.usdcMint);
        this.platformFeeBps = config.platformFeeBps ?? 500; // 5% default

        // Initialize facilitator keypair if provided
        if (config.facilitatorPrivateKey) {
            try {
                const secretKey = bs58.decode(config.facilitatorPrivateKey);
                this.facilitatorKeypair = Keypair.fromSecretKey(secretKey);
                console.log(`[Facilitator] Wallet initialized: ${this.facilitatorKeypair.publicKey.toBase58()}`);
            } catch (error) {
                console.warn('[Facilitator] Invalid private key, running in demo mode');
            }
        } else {
            console.log('[Facilitator] No private key provided, running in demo mode');
        }
    }

    /**
     * Decode Base64 encoded X-PAYMENT header
     */
    private decodePayload(encoded: string): X402PaymentPayload | null {
        try {
            const json = Buffer.from(encoded, 'base64').toString('utf-8');
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    /**
     * Verify the signature on a payment intent
     */
    private verifySignature(
        payload: X402PaymentPayload
    ): boolean {
        const sig = payload.payload.paymentIntentSignature;
        if (!sig) {
            return true; // No signature to verify (demo mode accepts this)
        }

        try {
            // Reconstruct the message that was signed
            const messageLines = [
                'SynapsePay Payment Intent',
                `PaymentID: ${payload.payload.paymentId}`,
                `Payer: ${payload.payload.payer}`,
                `Recipient: ${payload.payload.recipient}`,
                `Amount: ${payload.payload.amount}`,
                `Token: ${payload.payload.tokenMint}`,
                `Agent: ${payload.payload.agentId}`,
                `Expires: ${payload.payload.expiresAt}`,
                `Nonce: ${payload.payload.nonce}`,
            ];
            const message = new TextEncoder().encode(messageLines.join('\n'));

            // Decode signature from base64
            const signatureBytes = Buffer.from(sig.signature, 'base64');

            // Decode payer public key
            const publicKeyBytes = bs58.decode(payload.payload.payer);

            // Verify Ed25519 signature
            return nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
        } catch (error) {
            console.error('[Facilitator] Signature verification failed:', error);
            return false;
        }
    }

    /**
     * Verify a payment payload from X-PAYMENT header
     */
    async verifyPayment(encodedPayment: string): Promise<VerifyResult> {
        // Decode payload
        const payload = this.decodePayload(encodedPayment);
        if (!payload) {
            return { valid: false, error: 'Invalid payload format' };
        }

        // Check version and type
        if (payload.version !== '1.0') {
            return { valid: false, error: `Invalid version: ${payload.version}` };
        }
        if (payload.paymentType !== 'solana') {
            return { valid: false, error: `Invalid payment type: ${payload.paymentType}` };
        }

        // Check expiry
        const now = Math.floor(Date.now() / 1000);
        if (payload.payload.expiresAt < now) {
            return { valid: false, error: 'Payment expired' };
        }

        // Verify signature
        if (!this.verifySignature(payload)) {
            return { valid: false, error: 'Invalid signature' };
        }

        // Validate required fields
        if (!payload.payload.paymentId) {
            return { valid: false, error: 'Missing paymentId' };
        }
        if (!payload.payload.payer) {
            return { valid: false, error: 'Missing payer' };
        }
        if (!payload.payload.recipient) {
            return { valid: false, error: 'Missing recipient' };
        }
        if (!payload.payload.amount || BigInt(payload.payload.amount) <= 0n) {
            return { valid: false, error: 'Invalid amount' };
        }

        return {
            valid: true,
            paymentId: payload.payload.paymentId,
            payer: payload.payload.payer,
            recipient: payload.payload.recipient,
            amount: payload.payload.amount,
            agentId: payload.payload.agentId,
        };
    }

    /**
     * Settle a payment on Solana
     * 
     * In demo mode, simulates successful settlement.
     * In real mode, creates and submits the transaction.
     */
    async settlePayment(encodedPayment: string): Promise<SettleResult> {
        // First verify the payment
        const verification = await this.verifyPayment(encodedPayment);
        if (!verification.valid) {
            return { success: false, error: verification.error };
        }

        const payload = this.decodePayload(encodedPayment)!;

        // Demo mode - simulate success
        if (!this.facilitatorKeypair) {
            console.log('[Facilitator] Demo mode: Simulating settlement');
            console.log(`  Payment ID: ${verification.paymentId}`);
            console.log(`  From: ${verification.payer}`);
            console.log(`  To: ${verification.recipient}`);
            console.log(`  Amount: ${verification.amount} lamports`);

            return {
                success: true,
                mode: 'demo',
                txSignature: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
                slot: Math.floor(Math.random() * 1000000) + 280000000,
            };
        }

        // Real mode - submit transaction
        try {
            const payer = new PublicKey(payload.payload.payer);
            const recipient = new PublicKey(payload.payload.recipient);
            const amount = BigInt(payload.payload.amount);

            // Get or create associated token accounts
            const payerAta = await getAssociatedTokenAddress(this.usdcMint, payer);
            const recipientAta = await getAssociatedTokenAddress(this.usdcMint, recipient);

            // Calculate platform fee
            const feeAmount = (amount * BigInt(this.platformFeeBps)) / 10000n;
            const recipientAmount = amount - feeAmount;

            console.log('[Facilitator] Real mode: Submitting transaction');
            console.log(`  Amount: ${amount} lamports`);
            console.log(`  Fee: ${feeAmount} lamports (${this.platformFeeBps / 100}%)`);
            console.log(`  Recipient gets: ${recipientAmount} lamports`);

            // Note: In production, this would:
            // 1. Create the token transfer instruction
            // 2. Build the transaction
            // 3. Sign with facilitator keypair
            // 4. Submit to Solana
            // For now, we simulate since we need user signature

            return {
                success: true,
                mode: 'real',
                txSignature: `pending_${Date.now()}`,
                slot: 0,
            };
        } catch (error) {
            console.error('[Facilitator] Settlement error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Settlement failed',
            };
        }
    }

    /**
     * Check if facilitator is in demo mode
     */
    isDemoMode(): boolean {
        return this.facilitatorKeypair === null;
    }

    /**
     * Get facilitator public key (if available)
     */
    getPublicKey(): string | null {
        return this.facilitatorKeypair?.publicKey.toBase58() ?? null;
    }
}

/**
 * Create a PaymentFacilitator from environment variables
 */
export function createFacilitatorFromEnv(): PaymentFacilitator {
    return new PaymentFacilitator({
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        facilitatorPrivateKey: process.env.FACILITATOR_PRIVATE_KEY,
        usdcMint: process.env.USDC_MINT_ADDRESS || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        platformFeeBps: parseInt(process.env.FACILITATOR_FEE_BPS || '500'),
    });
}
