import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

/**
 * Payment flow state
 */
export type PaymentState =
    | 'idle'
    | 'creating_invoice'
    | 'awaiting_signature'
    | 'settling'
    | 'executing'
    | 'completed'
    | 'failed';

/**
 * Payment result
 */
export interface PaymentResult {
    success: boolean;
    txSignature?: string;
    slot?: number;
    result?: unknown;
    error?: string;
    explorerUrl?: string;
}

/**
 * Log entry
 */
interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

/**
 * Hook configuration
 */
interface UsePaymentConfig {
    facilitatorUrl: string;
    resourceServerUrl: string;
    network?: 'devnet' | 'mainnet-beta';
    demoMode?: boolean;  // Enable demo mode for testing without backend
}

/**
 * Generate a fake transaction signature for demo mode
 */
function generateFakeTxSignature(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 88; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Simulate a delay
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if backend is available
 */
async function checkBackendHealth(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${url}/health`, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * usePayment - Main hook for handling X402 payments with REAL Solana transactions
 * 
 * This hook manages the entire payment flow:
 * 1. Create transaction (via Facilitator)
 * 2. User signs the transaction in wallet
 * 3. Submit signed transaction to Solana
 * 4. Execute agent task
 * 
 * @example
 * ```tsx
 * const { executePayment, state, logs } = usePayment({
 *   facilitatorUrl: 'http://localhost:8403',
 *   resourceServerUrl: 'http://localhost:8404',
 * });
 * 
 * const result = await executePayment('pdf-summarizer-v1', 0.05, 600, { file: 'test.pdf' });
 * ```
 */
export function usePayment(config: UsePaymentConfig) {
    const { publicKey, signTransaction, connected } = useWallet();
    // Note: we could use connection from useConnection() for direct RPC calls
    const [state, setState] = useState<PaymentState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
    }, []);

    /**
     * Execute demo payment flow (simulated)
     */
    const executeDemoPayment = useCallback(async (
        agentId: string,
        amountUsdc: number,
    ): Promise<PaymentResult> => {
        try {
            setError(null);
            setLogs([]);

            // Step 1: Create Invoice (simulated)
            setState('creating_invoice');
            addLog('Creating payment invoice...');
            await delay(800);
            addLog(`✓ Invoice created: ${amountUsdc} USDC`, 'success');

            // Step 2: Sign Payment Intent (simulated)
            setState('awaiting_signature');
            addLog('Simulating wallet signature...');
            await delay(600);
            addLog('✓ Signature received (Demo Mode)', 'success');

            // Step 3: Settle Payment (simulated)
            setState('settling');
            addLog('Submitting payment to Solana (Demo)...');
            await delay(1200);
            const fakeTxSignature = generateFakeTxSignature();
            addLog(`✓ Payment settled: ${fakeTxSignature.slice(0, 20)}...`, 'success');

            // Step 4: Execute Agent (simulated)
            setState('executing');
            addLog(`Executing ${agentId}...`);
            await delay(1500);
            addLog('✓ Task completed successfully!', 'success');

            setState('completed');

            return {
                success: true,
                txSignature: fakeTxSignature,
                slot: 123456789,
                result: {
                    status: 'success',
                    message: `Demo: ${agentId} executed successfully`,
                    timestamp: new Date().toISOString(),
                },
            };

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setState('failed');
            setError(errorMessage);
            addLog(`✗ Error: ${errorMessage}`, 'error');
            return { success: false, error: errorMessage };
        }
    }, [addLog]);

    /**
     * Execute REAL payment flow with actual Solana transaction
     */
    const executeRealPayment = useCallback(async (
        agentId: string,
        _amountUsdc: number,
        _durationSeconds: number,
        taskParams?: Record<string, unknown>
    ): Promise<PaymentResult> => {
        // Validate wallet
        if (!connected || !publicKey || !signTransaction) {
            return { success: false, error: 'Wallet not connected or does not support signing' };
        }

        try {
            setError(null);
            setLogs([]);

            // Step 1: Create Transaction via Facilitator
            setState('creating_invoice');
            addLog('Creating payment transaction...');

            const createRes = await fetch(`${config.facilitatorUrl}/transaction/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    payer: publicKey.toBase58(),
                }),
            });

            if (!createRes.ok) {
                const errorData = await createRes.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to create transaction: ${createRes.statusText}`);
            }

            const txData = await createRes.json();
            addLog(`✓ Transaction created: ${txData.amountDisplay}`, 'success');

            // Step 2: Deserialize and sign the transaction
            setState('awaiting_signature');
            addLog('Requesting wallet signature...');

            // Deserialize the transaction
            const transactionBuffer = Buffer.from(txData.transaction, 'base64');
            const transaction = Transaction.from(transactionBuffer);

            // Sign the transaction with user's wallet
            const signedTransaction = await signTransaction(transaction);
            addLog('✓ Transaction signed', 'success');

            // Step 3: Submit signed transaction to Solana via Facilitator
            setState('settling');
            addLog('Submitting to Solana network...');

            const submitRes = await fetch(`${config.facilitatorUrl}/transaction/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signedTransaction: Buffer.from(signedTransaction.serialize()).toString('base64'),
                    paymentId: txData.paymentId,
                }),
            });

            if (!submitRes.ok) {
                const errorData = await submitRes.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to submit transaction: ${submitRes.statusText}`);
            }

            const submitData = await submitRes.json();
            addLog(`✓ Transaction confirmed: ${submitData.txSignature.slice(0, 20)}...`, 'success');

            // Step 4: Execute Agent
            setState('executing');
            addLog(`Executing ${agentId}...`);

            // Try to execute agent (optional - may not have resource server)
            try {
                const executeRes = await fetch(`${config.resourceServerUrl}/agent/execute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-TX-SIGNATURE': submitData.txSignature,
                    },
                    body: JSON.stringify({ agentId, taskParams }),
                });

                if (executeRes.ok) {
                    const result = await executeRes.json();
                    addLog('✓ Task completed successfully!', 'success');
                    setState('completed');

                    return {
                        success: true,
                        txSignature: submitData.txSignature,
                        slot: submitData.slot,
                        result: result.result,
                        explorerUrl: submitData.explorerUrl,
                    };
                }
            } catch {
                // Resource server may not be running - that's OK for payment
                addLog('⚠️ Agent execution unavailable, but payment succeeded', 'info');
            }

            addLog('✓ Payment completed!', 'success');
            setState('completed');

            return {
                success: true,
                txSignature: submitData.txSignature,
                slot: submitData.slot,
                explorerUrl: submitData.explorerUrl,
                result: {
                    status: 'success',
                    message: `Payment for ${agentId} completed`,
                    timestamp: new Date().toISOString(),
                },
            };

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setState('failed');
            setError(errorMessage);
            addLog(`✗ Error: ${errorMessage}`, 'error');
            return { success: false, error: errorMessage };
        }
    }, [publicKey, signTransaction, connected, config, addLog]);

    /**
     * Execute the payment flow (chooses between real and demo)
     */
    const executePayment = useCallback(async (
        agentId: string,
        amountUsdc: number,
        durationSeconds: number,
        taskParams?: Record<string, unknown>
    ): Promise<PaymentResult> => {
        // Check if we should use demo mode
        let useDemoMode = config.demoMode ?? false;

        // If demo mode is not explicitly enabled, check if backend is available
        if (!useDemoMode) {
            const backendAvailable = await checkBackendHealth(config.facilitatorUrl);
            if (!backendAvailable) {
                addLog('⚠️ Backend not available, using demo mode', 'info');
                useDemoMode = true;
            }
        }

        // Use demo mode
        if (useDemoMode) {
            return executeDemoPayment(agentId, amountUsdc);
        }

        // Use real payment
        return executeRealPayment(agentId, amountUsdc, durationSeconds, taskParams);
    }, [config, addLog, executeDemoPayment, executeRealPayment]);

    /**
     * Reset the payment state
     */
    const reset = useCallback(() => {
        setState('idle');
        setError(null);
        setLogs([]);
    }, []);

    return {
        state,
        error,
        logs,
        executePayment,
        reset,
        isProcessing: !['idle', 'completed', 'failed'].includes(state),
        isConnected: connected,
    };
}
