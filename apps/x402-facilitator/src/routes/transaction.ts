import { Hono } from 'hono';
import { z } from 'zod';
import {
    Connection,
    PublicKey,
    Transaction,
    VersionedTransaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
    createTransferInstruction,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

export const transactionRoutes = new Hono();

// Configuration
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const USDC_MINT = new PublicKey(
    process.env.USDC_MINT_ADDRESS || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
);

// Set to true to use SOL instead of USDC for testing (when you don't have USDC)
const USE_SOL_FOR_TESTING = process.env.USE_SOL_PAYMENTS === 'true' || true;

// Agent configurations (prices in lamports for SOL, or micro-USDC for USDC)
const AGENT_CONFIG: Record<string, { price: number; priceSOL: number; recipient: string; name: string }> = {
    'pdf-summarizer-v1': {
        price: 50000, // 0.05 USDC (6 decimals)
        priceSOL: 0.001 * LAMPORTS_PER_SOL, // 0.001 SOL for testing
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'PDF Summarizer',
    },
    'image-editor-v1': {
        price: 100000, // 0.10 USDC
        priceSOL: 0.002 * LAMPORTS_PER_SOL,
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'Image Editor',
    },
    'nft-minter-v1': {
        price: 250000, // 0.25 USDC
        priceSOL: 0.005 * LAMPORTS_PER_SOL,
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'NFT Minter',
    },
    'code-debugger-v1': {
        price: 80000, // 0.08 USDC
        priceSOL: 0.0015 * LAMPORTS_PER_SOL,
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'Code Debugger',
    },
    'ugv-rover-01': {
        price: 100000, // 0.10 USDC
        priceSOL: 0.002 * LAMPORTS_PER_SOL,
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'UGV Rover Control',
    },
    'smart-led-array': {
        price: 50000, // 0.05 USDC
        priceSOL: 0.001 * LAMPORTS_PER_SOL,
        recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        name: 'Smart LED Array',
    },
};

/**
 * Create Transaction - Generates a payment transaction
 * Uses SOL or USDC based on configuration
 */
transactionRoutes.post('/create', async (c) => {
    try {
        const body = await c.req.json();
        const { agentId, payer } = body;

        if (!agentId || !payer) {
            return c.json({ error: 'Missing agentId or payer' }, 400);
        }

        const agent = AGENT_CONFIG[agentId];
        if (!agent) {
            return c.json({ error: 'Agent not found' }, 404);
        }

        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║          [FACILITATOR] Creating Payment Transaction          ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log(`  Agent: ${agent.name} (${agentId})`);
        console.log(`  Payer: ${payer.slice(0, 20)}...`);
        console.log(`  Recipient: ${agent.recipient.slice(0, 20)}...`);

        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        const payerPubkey = new PublicKey(payer);
        const recipientPubkey = new PublicKey(agent.recipient);

        console.log('  [FACILITATOR] Building transaction...');

        // Create transaction
        const transaction = new Transaction();

        let amountDisplay: string;
        let currency: string;

        if (USE_SOL_FOR_TESTING) {
            // SOL transfer (for testing when USDC not available)
            const solAmount = agent.priceSOL;
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: payerPubkey,
                    toPubkey: recipientPubkey,
                    lamports: solAmount,
                })
            );
            amountDisplay = `${(solAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
            currency = 'SOL';
            console.log(`[Facilitator] Using SOL for payment: ${amountDisplay}`);
        } else {
            // USDC transfer
            const payerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, payerPubkey);
            const recipientTokenAccount = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);

            // Check if recipient token account exists
            const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);

            if (!recipientAccountInfo) {
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        payerPubkey,
                        recipientTokenAccount,
                        recipientPubkey,
                        USDC_MINT,
                        TOKEN_PROGRAM_ID,
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                );
            }

            transaction.add(
                createTransferInstruction(
                    payerTokenAccount,
                    recipientTokenAccount,
                    payerPubkey,
                    agent.price,
                    [],
                    TOKEN_PROGRAM_ID
                )
            );
            amountDisplay = `${(agent.price / 1_000_000).toFixed(2)} USDC`;
            currency = 'USDC';
        }

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = payerPubkey;

        // Serialize transaction (unsigned - user will sign)
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        });

        const base64Transaction = serializedTransaction.toString('base64');

        console.log(`[Facilitator] Created transaction for ${agentId}`);
        console.log(`  Payer: ${payer}`);
        console.log(`  Recipient: ${agent.recipient}`);
        console.log(`  Amount: ${amountDisplay}`);

        return c.json({
            success: true,
            transaction: base64Transaction,
            paymentId: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            agentId,
            amount: USE_SOL_FOR_TESTING ? agent.priceSOL : agent.price,
            amountDisplay,
            currency,
            recipient: agent.recipient,
            blockhash,
            lastValidBlockHeight,
        });
    } catch (error) {
        console.error('[Facilitator] Error creating transaction:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create transaction',
        }, 500);
    }
});

/**
 * Submit Transaction - Receives signed transaction and submits to Solana
 */
transactionRoutes.post('/submit', async (c) => {
    try {
        const body = await c.req.json();
        const { signedTransaction, paymentId } = body;

        if (!signedTransaction) {
            return c.json({ error: 'Missing signedTransaction' }, 400);
        }

        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║          [FACILITATOR] Processing Payment                    ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log(`  Payment ID: ${paymentId}`);

        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

        // Deserialize the signed transaction
        const transactionBuffer = Buffer.from(signedTransaction, 'base64');

        console.log('  [FACILITATOR] Deserializing signed transaction...');

        let txSignature: string;
        let transaction: Transaction;

        try {
            // Try as regular Transaction first
            transaction = Transaction.from(transactionBuffer);
            console.log('  [FACILITATOR] Transaction deserialized successfully');

            // Log transaction details
            console.log('');
            console.log('  ┌─────────────────────────────────────────────────────────────┐');
            console.log('  │ Transaction Details                                         │');
            console.log('  ├─────────────────────────────────────────────────────────────┤');
            console.log(`  │ Recent Blockhash: ${transaction.recentBlockhash?.slice(0, 20)}...`);
            console.log(`  │ Fee Payer: ${transaction.feePayer?.toBase58().slice(0, 20)}...`);
            console.log(`  │ Instructions: ${transaction.instructions.length}`);
            console.log('  └─────────────────────────────────────────────────────────────┘');
            console.log('');

            console.log('  [FACILITATOR] Submitting transaction to Solana network...');

            // Send the transaction
            txSignature = await connection.sendRawTransaction(
                transaction.serialize(),
                {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                }
            );
        } catch (e) {
            // Try as VersionedTransaction
            console.log('  [FACILITATOR] Trying VersionedTransaction...');
            const versionedTx = VersionedTransaction.deserialize(transactionBuffer);
            txSignature = await connection.sendRawTransaction(
                versionedTx.serialize(),
                {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                }
            );
        }

        console.log(`  [FACILITATOR] Transaction submitted!`);
        console.log(`    Signature: ${txSignature}`);
        console.log('');
        console.log('  [FACILITATOR] Waiting for confirmation...');

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(txSignature, 'confirmed');

        if (confirmation.value.err) {
            console.error('  ❌ [FACILITATOR] Transaction FAILED:', confirmation.value.err);
            return c.json({
                success: false,
                error: 'Transaction failed on-chain',
                details: confirmation.value.err,
            }, 400);
        }

        // Get slot
        const slot = confirmation.context.slot;

        console.log('');
        console.log('  ╔═══════════════════════════════════════════════════════════════╗');
        console.log('  ║                    ✅ TRANSACTION CONFIRMED!                  ║');
        console.log('  ╠═══════════════════════════════════════════════════════════════╣');
        console.log(`  ║ Signature: ${txSignature.slice(0, 44)}...`);
        console.log(`  ║ Slot: ${slot}`);
        console.log(`  ║ Status: FINALIZED`);
        console.log('  ╠═══════════════════════════════════════════════════════════════╣');
        console.log(`  ║ Explorer: https://explorer.solana.com/tx/${txSignature.slice(0, 20)}...`);
        console.log('  ╚═══════════════════════════════════════════════════════════════╝');
        console.log('');

        return c.json({
            success: true,
            txSignature,
            slot,
            paymentId,
            explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
            solscanUrl: `https://solscan.io/tx/${txSignature}?cluster=devnet`,
        });
    } catch (error) {
        console.error('  ❌ [Facilitator] Error submitting transaction:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to submit transaction',
        }, 500);
    }
});

/**
 * Check Transaction Status
 */
transactionRoutes.get('/status/:signature', async (c) => {
    try {
        const signature = c.req.param('signature');
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

        const status = await connection.getSignatureStatus(signature);

        if (!status.value) {
            return c.json({
                signature,
                status: 'not_found',
                message: 'Transaction not found',
            });
        }

        return c.json({
            signature,
            status: status.value.err ? 'failed' : 'confirmed',
            slot: status.value.slot,
            confirmations: status.value.confirmations,
            confirmationStatus: status.value.confirmationStatus,
            error: status.value.err,
            explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        });
    } catch (error) {
        return c.json({
            error: error instanceof Error ? error.message : 'Failed to check status',
        }, 500);
    }
});
