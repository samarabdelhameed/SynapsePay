

export interface X402PaymentPayload {
    version: '1.0';
    paymentType: 'solana';
    network: 'mainnet-beta' | 'devnet' | 'localnet';
    payload: SolanaPaymentPayload;
}

export interface SolanaPaymentPayload {
    paymentId: string;
    payer: string;
    recipient: string;
    amount: string;
    tokenMint: string;
    agentId: string;
    taskMetadata?: Record<string, unknown>;
    expiresAt: number;
    nonce: number;
    /** Payment intent signature (added by client after signing) */
    paymentIntentSignature?: {
        signature: string;
        nonce: number;
    };
}

export interface PaymentSignature {
    signature: string;
    publicKey: string;
}

export interface X402Invoice {
    invoiceId: string;
    amount: string;
    currency: string;
    recipient: string;
    agentId: string;
    network: string;
    expiresAt: number;
    createdAt: number;
}

export interface X402Receipt {
    receiptId: string;
    paymentId: string;
    payer: string;
    agentId: string;
    amount: string;
    resultCid: string;
    txSignature: string;
    slot: number;
    mintedAt: number;
}

export type PaymentState =
    | 'invoice_created'
    | 'pending'
    | 'executing'
    | 'completed'
    | 'receipt_minted'
    | 'claimed'
    | 'expired'
    | 'failed'
    | 'refunded';

export interface X402Config {
    facilitatorUrl: string;
    resourceServerUrl: string;
    network: 'mainnet-beta' | 'devnet' | 'localnet';
    rpcUrl: string;
    usdcMint: string;
    programIds: {
        registry: string;
        payments: string;
        scheduler: string;
    };
}

export const DEFAULT_CONFIG: Partial<X402Config> = {
    network: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};
