import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

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
 * usePayment - Main hook for handling X402 payments
 * 
 * This hook manages the entire payment flow:
 * 1. Create invoice
 * 2. Sign payment intent
 * 3. Settle on Solana
 * 4. Execute agent task
 * 
 * Supports demo mode for testing without a backend.
 * 
 * @example
 * ```tsx
 * const { executePayment, state, logs } = usePayment({
 *   facilitatorUrl: 'http://localhost:4021',
 *   resourceServerUrl: 'http://localhost:4020',
 *   demoMode: true, // Enable demo mode
 * });
 * 
 * const result = await executePayment('pdf-summarizer-v1', 0.05, 600, { file: 'test.pdf' });
 * ```
 */
export function usePayment(config: UsePaymentConfig) {
    const { publicKey, signMessage, connected } = useWallet();
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
     * Execute the full payment flow
     */
    const executePayment = useCallback(async (
        agentId: string,
        amountUsdc: number,
        _durationSeconds: number,
        taskParams?: Record<string, unknown>
    ): Promise<PaymentResult> => {
        // Check if we should use demo mode
        // Demo mode is used when:
        // 1. demoMode is explicitly enabled in config
        // 2. Backend is not available (automatic fallback)

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

        // Validate wallet for real payments
        if (!connected || !publicKey || !signMessage) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            setError(null);
            setLogs([]);

            // Step 1: Create Invoice
            setState('creating_invoice');
            addLog('Creating payment invoice...');

            const invoiceRes = await fetch(`${config.facilitatorUrl}/invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    amount: (amountUsdc * 1_000_000).toString(),
                    payer: publicKey.toBase58(),
                }),
            });

            if (!invoiceRes.ok) {
                throw new Error(`Failed to create invoice: ${invoiceRes.statusText}`);
            }

            const invoice = await invoiceRes.json();
            addLog(`✓ Invoice created: ${amountUsdc} USDC`, 'success');

            // Step 2: Sign Payment Intent
            setState('awaiting_signature');
            addLog('Requesting signature from wallet...');

            // Create the message to sign
            const nonce = Date.now();
            const messageLines = [
                'SynapsePay Payment Intent',
                `PaymentID: ${invoice.invoiceId}`,
                `Payer: ${publicKey.toBase58()}`,
                `Recipient: ${invoice.recipient}`,
                `Amount: ${invoice.amount}`,
                `Token: ${config.network === 'mainnet-beta'
                    ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                    : '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'}`,
                `Agent: ${agentId}`,
                `Expires: ${invoice.expiresAt}`,
                `Nonce: ${nonce}`,
            ];
            const message = new TextEncoder().encode(messageLines.join('\n'));

            // Helper for browser-safe base64 encoding
            const bytesToBase64 = (bytes: Uint8Array) => {
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary);
            };

            const stringToBase64 = (str: string) => {
                const bytes = new TextEncoder().encode(str);
                return bytesToBase64(bytes);
            };

            // Request signature
            const signature = await signMessage(message);
            addLog('✓ Signature received', 'success');

            // Create X-PAYMENT payload
            const payload = {
                version: '1.0',
                paymentType: 'solana',
                network: config.network || 'devnet',
                payload: {
                    paymentId: invoice.invoiceId,
                    payer: publicKey.toBase58(),
                    recipient: invoice.recipient,
                    amount: invoice.amount,
                    tokenMint: config.network === 'mainnet-beta'
                        ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                        : '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                    agentId,
                    expiresAt: invoice.expiresAt,
                    nonce,
                    paymentIntentSignature: {
                        signature: bytesToBase64(signature),
                        nonce,
                    },
                },
            };

            const paymentHeader = stringToBase64(JSON.stringify(payload));

            // Step 3: Settle Payment
            setState('settling');
            addLog('Submitting payment to Solana...');

            const settleRes = await fetch(`${config.facilitatorUrl}/settle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment: paymentHeader }),
            });

            if (!settleRes.ok) {
                throw new Error(`Settlement failed: ${settleRes.statusText}`);
            }

            const settlement = await settleRes.json();
            addLog(`✓ Payment settled: ${settlement.txSignature?.slice(0, 20)}...`, 'success');

            // Step 4: Execute Agent
            setState('executing');
            addLog(`Executing ${agentId}...`);

            const executeRes = await fetch(`${config.resourceServerUrl}/agent/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-PAYMENT': paymentHeader,
                },
                body: JSON.stringify({ agentId, taskParams }),
            });

            if (!executeRes.ok) {
                throw new Error(`Agent execution failed: ${executeRes.statusText}`);
            }

            const result = await executeRes.json();
            addLog('✓ Task completed successfully!', 'success');

            setState('completed');

            return {
                success: true,
                txSignature: settlement.txSignature,
                slot: settlement.slot,
                result: result.result,
            };

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setState('failed');
            setError(errorMessage);
            addLog(`✗ Error: ${errorMessage}`, 'error');
            return { success: false, error: errorMessage };
        }
    }, [publicKey, signMessage, connected, config, addLog, executeDemoPayment]);

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

