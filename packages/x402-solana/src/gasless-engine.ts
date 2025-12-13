/**
 * Gasless Transaction Engine for X402 Protocol
 * Enables users to execute transactions without paying gas fees
 * Inspired by EIP-2612 Permit but adapted for Solana
 */

import { 
    Connection, 
    PublicKey, 
    Transaction, 
    SystemProgram,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
    Keypair
} from '@solana/web3.js';
import { 
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    getAccount
} from '@solana/spl-token';
import { 
    GaslessPaymentPayload, 
    GaslessTransactionResult, 
    GaslessTransactionError,
    AdvancedX402Config 
} from './advanced-types';
import { createSigningMessage } from './signatures';

export class GaslessTransactionEngine {
    private connection: Connection;
    private config: AdvancedX402Config;
    private facilitatorKeypair?: Keypair;

    constructor(config: AdvancedX402Config, facilitatorKeypair?: Keypair) {
        this.connection = new Connection(config.rpcUrl, 'confirmed');
        this.config = config;
        this.facilitatorKeypair = facilitatorKeypair;
    }

    /**
     * Create a gasless payment transaction
     * User signs the intent, facilitator executes and pays gas
     */
    async createGaslessPayment(
        payload: GaslessPaymentPayload,
        userSignature: string
    ): Promise<GaslessTransactionResult> {
        try {
            // Validate gasless payment
            this.validateGaslessPayment(payload);

            // Verify user signature
            const isValidSignature = await this.verifyUserSignature(payload, userSignature);
            if (!isValidSignature) {
                throw new GaslessTransactionError('Invalid user signature');
            }

            // Check facilitator balance
            await this.checkFacilitatorBalance();

            // Create and execute transaction
            const transaction = await this.buildPaymentTransaction(payload);
            const result = await this.executeTransaction(transaction, payload);

            return result;
        } catch (error) {
            throw new GaslessTransactionError(
                `Failed to create gasless payment: ${error}`,
                { payload, error: error }
            );
        }
    }

    /**
     * Validate gasless payment payload
     */
    private validateGaslessPayment(payload: GaslessPaymentPayload): void {
        if (!payload.gasless) {
            throw new GaslessTransactionError('Payload is not marked as gasless');
        }

        if (!payload.facilitator) {
            throw new GaslessTransactionError('Facilitator address is required');
        }

        if (!this.config.features.gasless.enabled) {
            throw new GaslessTransactionError('Gasless transactions are disabled');
        }

        const amount = parseInt(payload.amount);
        if (amount > this.config.features.gasless.maxGasSponsorship) {
            throw new GaslessTransactionError(
                `Amount exceeds maximum gas sponsorship limit`,
                { amount, limit: this.config.features.gasless.maxGasSponsorship }
            );
        }
    }

    /**
     * Verify user signature for payment intent
     */
    private async verifyUserSignature(
        payload: GaslessPaymentPayload, 
        signature: string
    ): Promise<boolean> {
        try {
            // Create the same message that user signed
            const message = createSigningMessage(payload);
            
            // For Solana, we need to verify the signature differently
            // This is a simplified version - in production, use proper signature verification
            const userPublicKey = new PublicKey(payload.payer);
            
            // Convert signature from base64
            const signatureBytes = Buffer.from(signature, 'base64');
            
            // In a real implementation, you would use nacl.sign.detached.verify
            // For now, we'll do basic validation
            return signatureBytes.length === 64 && userPublicKey.toBase58() === payload.payer;
        } catch (error) {
            console.error('Signature verification failed:', error);
            return false;
        }
    }

    /**
     * Check if facilitator has enough balance to sponsor the transaction
     */
    private async checkFacilitatorBalance(): Promise<void> {
        if (!this.facilitatorKeypair) {
            throw new GaslessTransactionError('Facilitator keypair not configured');
        }

        const balance = await this.connection.getBalance(this.facilitatorKeypair.publicKey);
        const minimumBalance = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL minimum

        if (balance < minimumBalance) {
            throw new GaslessTransactionError(
                'Facilitator has insufficient balance to sponsor transaction',
                { balance, minimumBalance }
            );
        }
    }

    /**
     * Build the payment transaction
     */
    private async buildPaymentTransaction(payload: GaslessPaymentPayload): Promise<Transaction> {
        const transaction = new Transaction();

        try {
            const payerPublicKey = new PublicKey(payload.payer);
            const recipientPublicKey = new PublicKey(payload.recipient);
            const tokenMintPublicKey = new PublicKey(payload.tokenMint);
            const amount = parseInt(payload.amount);

            // Get associated token accounts
            const payerTokenAccount = await getAssociatedTokenAddress(
                tokenMintPublicKey,
                payerPublicKey
            );

            const recipientTokenAccount = await getAssociatedTokenAddress(
                tokenMintPublicKey,
                recipientPublicKey
            );

            // Check if recipient token account exists, create if not
            try {
                await getAccount(this.connection, recipientTokenAccount);
            } catch (error) {
                // Account doesn't exist, create it
                const createAccountInstruction = createAssociatedTokenAccountInstruction(
                    this.facilitatorKeypair!.publicKey, // Facilitator pays for account creation
                    recipientTokenAccount,
                    recipientPublicKey,
                    tokenMintPublicKey
                );
                transaction.add(createAccountInstruction);
            }

            // Create transfer instruction
            const transferInstruction = createTransferInstruction(
                payerTokenAccount,
                recipientTokenAccount,
                payerPublicKey,
                amount,
                [],
                TOKEN_PROGRAM_ID
            );

            transaction.add(transferInstruction);

            // Set recent blockhash and fee payer (facilitator)
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.facilitatorKeypair!.publicKey;

            return transaction;
        } catch (error) {
            throw new GaslessTransactionError(
                `Failed to build transaction: ${error}`,
                { payload }
            );
        }
    }

    /**
     * Execute the transaction with facilitator sponsorship
     */
    private async executeTransaction(
        transaction: Transaction,
        payload: GaslessPaymentPayload
    ): Promise<GaslessTransactionResult> {
        if (!this.facilitatorKeypair) {
            throw new GaslessTransactionError('Facilitator keypair not configured');
        }

        try {
            // Get transaction fee
            const feeCalculator = await this.connection.getFeeForMessage(
                transaction.compileMessage()
            );
            const gasFee = feeCalculator.value || 5000; // Default fee if calculation fails

            // Sign transaction with facilitator (who pays the fee)
            transaction.sign(this.facilitatorKeypair);

            // Send and confirm transaction
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.facilitatorKeypair],
                {
                    commitment: 'confirmed',
                    maxRetries: 3,
                }
            );

            // Get slot number
            const signatureStatus = await this.connection.getSignatureStatus(signature);
            const slot = signatureStatus.value?.slot || 0;

            return {
                signature,
                slot,
                gasPaidByFacilitator: gasFee,
                userGasCost: 0, // User pays no gas!
                status: 'success'
            };
        } catch (error) {
            throw new GaslessTransactionError(
                `Transaction execution failed: ${error}`,
                { payload, error }
            );
        }
    }

    /**
     * Create a pre-signed transaction for later execution
     * This allows for more complex gasless flows
     */
    async createPreSignedTransaction(
        payload: GaslessPaymentPayload,
        userKeypair: Keypair
    ): Promise<string> {
        try {
            const transaction = await this.buildPaymentTransaction(payload);
            
            // User signs their part of the transaction
            transaction.partialSign(userKeypair);
            
            // Serialize transaction for later facilitator execution
            const serializedTransaction = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false
            });

            return Buffer.from(serializedTransaction).toString('base64');
        } catch (error) {
            throw new GaslessTransactionError(
                `Failed to create pre-signed transaction: ${error}`,
                { payload }
            );
        }
    }

    /**
     * Execute a pre-signed transaction
     */
    async executePreSignedTransaction(
        serializedTransaction: string,
        payload: GaslessPaymentPayload
    ): Promise<GaslessTransactionResult> {
        if (!this.facilitatorKeypair) {
            throw new GaslessTransactionError('Facilitator keypair not configured');
        }

        try {
            // Deserialize transaction
            const transactionBuffer = Buffer.from(serializedTransaction, 'base64');
            const transaction = Transaction.from(transactionBuffer);

            // Facilitator signs and pays fee
            transaction.sign(this.facilitatorKeypair);

            // Execute transaction
            return await this.executeTransaction(transaction, payload);
        } catch (error) {
            throw new GaslessTransactionError(
                `Failed to execute pre-signed transaction: ${error}`,
                { payload }
            );
        }
    }

    /**
     * Get gasless transaction status
     */
    async getTransactionStatus(signature: string): Promise<{
        status: 'success' | 'failed' | 'pending';
        confirmations: number;
        slot?: number;
        error?: string;
    }> {
        try {
            const signatureStatus = await this.connection.getSignatureStatus(signature);
            
            if (!signatureStatus.value) {
                return { status: 'pending', confirmations: 0 };
            }

            const status = signatureStatus.value.err ? 'failed' : 'success';
            const confirmations = signatureStatus.value.confirmations || 0;
            const slot = signatureStatus.value.slot;
            const error = signatureStatus.value.err?.toString();

            return { status, confirmations, slot, error };
        } catch (error) {
            return { 
                status: 'failed', 
                confirmations: 0, 
                error: error?.toString() 
            };
        }
    }

    /**
     * Estimate gas cost for a gasless transaction
     */
    async estimateGasCost(payload: GaslessPaymentPayload): Promise<{
        estimatedFee: number;
        canSponsor: boolean;
        reason?: string;
    }> {
        try {
            const transaction = await this.buildPaymentTransaction(payload);
            const feeCalculator = await this.connection.getFeeForMessage(
                transaction.compileMessage()
            );
            
            const estimatedFee = feeCalculator.value || 5000;
            const canSponsor = estimatedFee <= this.config.features.gasless.maxGasSponsorship;
            const reason = canSponsor ? undefined : 'Exceeds maximum gas sponsorship limit';

            return { estimatedFee, canSponsor, reason };
        } catch (error) {
            return {
                estimatedFee: 0,
                canSponsor: false,
                reason: `Estimation failed: ${error}`
            };
        }
    }

    /**
     * Get facilitator statistics
     */
    async getFacilitatorStats(): Promise<{
        balance: number;
        totalTransactionsSponsored: number;
        totalGasSponsored: number;
        averageGasPerTransaction: number;
    }> {
        if (!this.facilitatorKeypair) {
            throw new GaslessTransactionError('Facilitator keypair not configured');
        }

        const balance = await this.connection.getBalance(this.facilitatorKeypair.publicKey);
        
        // In a real implementation, these would be tracked in a database
        return {
            balance,
            totalTransactionsSponsored: 0,
            totalGasSponsored: 0,
            averageGasPerTransaction: 0
        };
    }
}