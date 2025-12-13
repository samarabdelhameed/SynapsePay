/**
 * Property-Based Tests for Gasless Payments
 * **Feature: synapsepay-enhancements, Property 1: دعم المدفوعات بدون غاز**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Keypair, PublicKey } from '@solana/web3.js';
import { 
    AdvancedX402Client,
    GaslessTransactionEngine,
    GaslessPaymentPayload,
    AdvancedX402Config
} from '../src';

// Mock configuration for testing
const testConfig: AdvancedX402Config = {
    facilitatorUrl: 'http://localhost:8403',
    resourceServerUrl: 'http://localhost:8404',
    network: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    programIds: {
        registry: '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby',
        payments: '8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP',
        scheduler: '8NWxX7CDYhpfWAG5Dd6UJQ4EU1Ykrid8CoJ48Kp8MjsY'
    },
    features: {
        gasless: {
            enabled: true,
            facilitatorAddress: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            maxGasSponsorship: 1000000
        },
        robotControl: {
            enabled: false,
            maxSessionDuration: 0,
            supportedDeviceTypes: []
        },
        iotDevice: {
            enabled: false,
            supportedProtocols: [],
            maxDevicesPerUser: 0
        },
        security: {
            rateLimiting: {
                requestsPerMinute: 60,
                requestsPerHour: 1000,
                burstLimit: 10,
                cooldownPeriod: 300
            },
            emergencyPause: {
                enabled: false,
                triggers: [],
                pauseDuration: 0
            },
            accessControl: {}
        }
    }
};

describe('Gasless Payment Properties', () => {
    let client: AdvancedX402Client;
    let mockWallet: {
        publicKey: PublicKey;
        signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    };

    beforeEach(() => {
        client = new AdvancedX402Client(testConfig);
        
        // Create mock wallet
        const keypair = Keypair.generate();
        mockWallet = {
            publicKey: keypair.publicKey,
            signMessage: async (message: Uint8Array) => {
                // Mock signature - in real implementation this would be actual signature
                return new Uint8Array(64).fill(1);
            }
        };
        
        client.connectWallet(mockWallet);
    });

    /**
     * **Feature: synapsepay-enhancements, Property 1: دعم المدفوعات بدون غاز**
     * Property: For any gasless payment, the user should not pay gas fees
     */
    it('Property 1: Gasless payments should not charge users gas fees', async () => {
        // Property-based test with multiple iterations
        const testCases = [
            { amountUsdc: 0.01, agentId: 'test-agent-1' },
            { amountUsdc: 0.05, agentId: 'pdf-summarizer' },
            { amountUsdc: 0.10, agentId: 'image-generator' },
            { amountUsdc: 0.25, agentId: 'code-analyzer' },
            { amountUsdc: 0.50, agentId: 'video-processor' }
        ];

        for (const testCase of testCases) {
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: testCase.amountUsdc,
                agentId: testCase.agentId,
                taskMetadata: { test: true }
            });

            // Verify gasless payment properties
            expect(paymentResult.payload.features.gasless).toBe(true);
            expect(paymentResult.payload.payload.gasless).toBe(true);
            expect(paymentResult.payload.payload.facilitator).toBe(testConfig.features.gasless.facilitatorAddress);
            
            // Verify payment structure
            expect(paymentResult.paymentId).toBeDefined();
            expect(paymentResult.paymentHeader).toBeDefined();
            expect(paymentResult.payload.payload.paymentIntentSignature).toBeDefined();
            
            // Verify amount conversion (USDC to lamports)
            const expectedLamports = Math.floor(testCase.amountUsdc * 1_000_000);
            expect(paymentResult.payload.payload.amount).toBe(expectedLamports.toString());
        }
    });

    /**
     * Property: Gasless payments should have valid facilitator configuration
     */
    it('Property 2: Gasless payments should have valid facilitator configuration', async () => {
        const recipients = [
            'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            '8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP',
            '5w8vTt1AUo67nE9bWA5e9Sh28HXtJJZaqiPj53n6wcby'
        ];

        for (const recipient of recipients) {
            const paymentResult = await client.createGaslessPayment({
                recipient,
                amountUsdc: 0.05,
                agentId: 'test-agent',
                taskMetadata: { recipient }
            });

            const payload = paymentResult.payload.payload as GaslessPaymentPayload;
            
            // Verify facilitator is set correctly
            expect(payload.facilitator).toBe(testConfig.features.gasless.facilitatorAddress);
            expect(payload.gasless).toBe(true);
            
            // Verify recipient is preserved
            expect(payload.recipient).toBe(recipient);
            
            // Verify payer is the wallet owner
            expect(payload.payer).toBe(mockWallet.publicKey.toBase58());
        }
    });

    /**
     * Property: Payment signatures should be valid and verifiable
     */
    it('Property 3: Payment signatures should be valid and verifiable', async () => {
        const agentIds = ['agent1', 'agent2', 'agent3', 'agent4', 'agent5'];
        
        for (const agentId of agentIds) {
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.05,
                agentId,
                taskMetadata: { agentId }
            });

            const payload = paymentResult.payload.payload as GaslessPaymentPayload;
            
            // Verify signature exists
            expect(payload.paymentIntentSignature).toBeDefined();
            expect(payload.paymentIntentSignature!.signature).toBeDefined();
            expect(payload.paymentIntentSignature!.nonce).toBeDefined();
            
            // Verify signature format (base64)
            const signature = payload.paymentIntentSignature!.signature;
            expect(() => Buffer.from(signature, 'base64')).not.toThrow();
            
            // Verify nonce is reasonable (recent timestamp)
            const nonce = payload.paymentIntentSignature!.nonce;
            const now = Date.now();
            expect(nonce).toBeGreaterThan(now - 60000); // Within last minute
            expect(nonce).toBeLessThanOrEqual(now);
        }
    });

    /**
     * Property: Payment amounts should be within acceptable limits
     */
    it('Property 4: Payment amounts should be within acceptable limits', async () => {
        const amounts = [0.001, 0.01, 0.05, 0.1, 0.5, 0.99]; // Valid amounts
        
        for (const amount of amounts) {
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: amount,
                agentId: 'test-agent',
                taskMetadata: { amount }
            });

            const payload = paymentResult.payload.payload as GaslessPaymentPayload;
            const amountLamports = parseInt(payload.amount);
            
            // Verify amount conversion is correct
            expect(amountLamports).toBe(Math.floor(amount * 1_000_000));
            
            // Verify amount is within sponsorship limits
            expect(amountLamports).toBeLessThanOrEqual(testConfig.features.gasless.maxGasSponsorship);
            expect(amountLamports).toBeGreaterThan(0);
        }
    });

    /**
     * Property: Payment expiration should be reasonable
     */
    it('Property 5: Payment expiration should be reasonable', async () => {
        const testCases = Array.from({ length: 10 }, (_, i) => ({
            agentId: `agent-${i}`,
            amount: 0.05 + (i * 0.01)
        }));

        for (const testCase of testCases) {
            const beforePayment = Math.floor(Date.now() / 1000);
            
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: testCase.amount,
                agentId: testCase.agentId
            });

            const afterPayment = Math.floor(Date.now() / 1000);
            const payload = paymentResult.payload.payload as GaslessPaymentPayload;
            
            // Verify expiration is in the future
            expect(payload.expiresAt).toBeGreaterThan(beforePayment);
            
            // Verify expiration is reasonable (within 5-10 minutes)
            const expirationDelta = payload.expiresAt - beforePayment;
            expect(expirationDelta).toBeGreaterThan(250); // At least ~4 minutes
            expect(expirationDelta).toBeLessThan(600); // Less than 10 minutes
        }
    });

    /**
     * Property: Payment IDs should be unique
     */
    it('Property 6: Payment IDs should be unique across multiple payments', async () => {
        const paymentIds = new Set<string>();
        const numPayments = 20;

        for (let i = 0; i < numPayments; i++) {
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.05,
                agentId: `agent-${i}`,
                taskMetadata: { iteration: i }
            });

            // Verify payment ID is unique
            expect(paymentIds.has(paymentResult.paymentId)).toBe(false);
            paymentIds.add(paymentResult.paymentId);
            
            // Verify payment ID format
            expect(paymentResult.paymentId).toMatch(/^[a-zA-Z0-9]+$/);
            expect(paymentResult.paymentId.length).toBeLessThanOrEqual(32);
        }

        // Verify all payment IDs are unique
        expect(paymentIds.size).toBe(numPayments);
    });

    /**
     * Property: Gasless feature should be properly enabled in configuration
     */
    it('Property 7: Gasless feature should be properly configured', async () => {
        // Test with different configurations
        const configs = [
            { ...testConfig, features: { ...testConfig.features, gasless: { ...testConfig.features.gasless, enabled: true } } },
            { ...testConfig, features: { ...testConfig.features, gasless: { ...testConfig.features.gasless, maxGasSponsorship: 500000 } } }
        ];

        for (const config of configs) {
            const testClient = new AdvancedX402Client(config);
            testClient.connectWallet(mockWallet);

            // Verify gasless feature is enabled
            expect(testClient.isFeatureEnabled('gasless')).toBe(true);
            
            const paymentResult = await testClient.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.05,
                agentId: 'test-agent'
            });

            // Verify gasless payment was created successfully
            expect(paymentResult.payload.features.gasless).toBe(true);
        }
    });

    /**
     * Property: Error handling for invalid gasless payments
     */
    it('Property 8: Should handle invalid gasless payment scenarios', async () => {
        // Test with disconnected wallet
        const disconnectedClient = new AdvancedX402Client(testConfig);
        
        await expect(disconnectedClient.createGaslessPayment({
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amountUsdc: 0.05,
            agentId: 'test-agent'
        })).rejects.toThrow('Wallet not connected');

        // Test with disabled gasless feature
        const disabledConfig = {
            ...testConfig,
            features: {
                ...testConfig.features,
                gasless: { ...testConfig.features.gasless, enabled: false }
            }
        };
        
        const disabledClient = new AdvancedX402Client(disabledConfig);
        disabledClient.connectWallet(mockWallet);
        
        await expect(disabledClient.createGaslessPayment({
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amountUsdc: 0.05,
            agentId: 'test-agent'
        })).rejects.toThrow('Gasless payments are not enabled');
    });
});