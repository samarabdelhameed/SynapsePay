/**
 * Property-Based Tests for Signature-Only Approvals
 * **Feature: synapsepay-enhancements, Property 2: الموافقات عبر التوقيع فقط**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Keypair, PublicKey } from '@solana/web3.js';
import { 
    AdvancedX402Client,
    GaslessPaymentPayload,
    AdvancedX402Config,
    createSigningMessage,
    signPaymentIntent,
    verifyPaymentSignature
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

describe('Signature-Only Approval Properties', () => {
    let client: AdvancedX402Client;
    let userKeypair: Keypair;
    let mockWallet: {
        publicKey: PublicKey;
        signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    };

    beforeEach(() => {
        client = new AdvancedX402Client(testConfig);
        userKeypair = Keypair.generate();
        
        // Create mock wallet with actual signing capability
        mockWallet = {
            publicKey: userKeypair.publicKey,
            signMessage: async (message: Uint8Array) => {
                // Use actual nacl signing for testing
                const nacl = require('tweetnacl');
                return nacl.sign.detached(message, userKeypair.secretKey);
            }
        };
        
        client.connectWallet(mockWallet);
    });

    /**
     * **Feature: synapsepay-enhancements, Property 2: الموافقات عبر التوقيع فقط**
     * Property: For any approval operation, it should only require a signature, not a transaction
     */
    it('Property 1: Approvals should only require signatures, not transactions', async () => {
        const testCases = [
            { amountUsdc: 0.01, agentId: 'micro-task' },
            { amountUsdc: 0.05, agentId: 'standard-task' },
            { amountUsdc: 0.10, agentId: 'premium-task' },
            { amountUsdc: 0.25, agentId: 'complex-task' },
            { amountUsdc: 0.50, agentId: 'advanced-task' }
        ];

        for (const testCase of testCases) {
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: testCase.amountUsdc,
                agentId: testCase.agentId,
                taskMetadata: { signatureOnly: true }
            });

            const payload = paymentResult.payload.payload as GaslessPaymentPayload;
            
            // Verify that approval was done via signature only
            expect(payload.paymentIntentSignature).toBeDefined();
            expect(payload.paymentIntentSignature!.signature).toBeDefined();
            
            // Verify no transaction was created for approval
            expect(payload.preSignedTx).toBeUndefined();
            
            // Verify gasless flag indicates facilitator will handle transaction
            expect(payload.gasless).toBe(true);
            expect(payload.facilitator).toBeDefined();
            
            // Verify signature format is valid base64
            const signature = payload.paymentIntentSignature!.signature;
            expect(() => Buffer.from(signature, 'base64')).not.toThrow();
            
            // Verify signature length (64 bytes for ed25519)
            const signatureBytes = Buffer.from(signature, 'base64');
            expect(signatureBytes.length).toBe(64);
        }
    });

    /**
     * Property: Signature verification should work correctly for all valid signatures
     */
    it('Property 2: All generated signatures should be verifiable', async () => {
        const agentIds = ['agent1', 'agent2', 'agent3', 'agent4', 'agent5'];
        
        for (const agentId of agentIds) {
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.05,
                agentId,
                taskMetadata: { verificationTest: true }
            });

            const payload = paymentResult.payload.payload as GaslessPaymentPayload;
            
            // Extract signature
            const signature = payload.paymentIntentSignature!.signature;
            const signatureBytes = Buffer.from(signature, 'base64');
            
            // Create the same message that was signed
            const message = createSigningMessage(payload);
            
            // Verify signature using nacl
            const nacl = require('tweetnacl');
            const isValid = nacl.sign.detached.verify(
                message,
                signatureBytes,
                userKeypair.publicKey.toBytes()
            );
            
            expect(isValid).toBe(true);
            
            // Also test with the built-in verification function
            const paymentSignature = {
                signature,
                publicKey: userKeypair.publicKey.toBase58()
            };
            
            const isValidBuiltIn = verifyPaymentSignature(payload, paymentSignature);
            expect(isValidBuiltIn).toBe(true);
        }
    });

    /**
     * Property: Signature nonces should prevent replay attacks
     */
    it('Property 3: Signature nonces should be unique and prevent replay', async () => {
        const nonces = new Set<number>();
        const numPayments = 15;

        for (let i = 0; i < numPayments; i++) {
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.05,
                agentId: `replay-test-${i}`,
                taskMetadata: { iteration: i }
            });

            const payload = paymentResult.payload.payload as GaslessPaymentPayload;
            const nonce = payload.paymentIntentSignature!.nonce;
            
            // Verify nonce is unique
            expect(nonces.has(nonce)).toBe(false);
            nonces.add(nonce);
            
            // Verify nonce is recent (within last minute)
            const now = Date.now();
            expect(nonce).toBeGreaterThan(now - 60000);
            expect(nonce).toBeLessThanOrEqual(now);
            
            // Verify nonce matches payload nonce
            expect(nonce).toBe(payload.nonce);
        }

        // Verify all nonces are unique
        expect(nonces.size).toBe(numPayments);
    });

    /**
     * Property: Signatures should be deterministic for the same input
     */
    it('Property 4: Signatures should be deterministic for identical payloads', async () => {
        // Create identical payloads with same nonce
        const baseNonce = Date.now();
        const testPayload = {
            paymentId: 'test-payment-123',
            payer: userKeypair.publicKey.toBase58(),
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amount: '50000',
            tokenMint: testConfig.usdcMint,
            agentId: 'deterministic-test',
            expiresAt: Math.floor((Date.now() + 300000) / 1000),
            nonce: baseNonce
        };

        // Sign the same payload multiple times
        const signatures: string[] = [];
        for (let i = 0; i < 5; i++) {
            const signature = signPaymentIntent(testPayload, userKeypair);
            signatures.push(signature.signature);
        }

        // All signatures should be identical for the same input
        const firstSignature = signatures[0];
        for (const signature of signatures) {
            expect(signature).toBe(firstSignature);
        }
    });

    /**
     * Property: Different inputs should produce different signatures
     */
    it('Property 5: Different payloads should produce different signatures', async () => {
        const basePayload = {
            paymentId: 'base-payment',
            payer: userKeypair.publicKey.toBase58(),
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amount: '50000',
            tokenMint: testConfig.usdcMint,
            agentId: 'base-agent',
            expiresAt: Math.floor((Date.now() + 300000) / 1000),
            nonce: Date.now()
        };

        // Create variations of the payload
        const variations = [
            { ...basePayload, amount: '60000' },
            { ...basePayload, agentId: 'different-agent' },
            { ...basePayload, recipient: '8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP' },
            { ...basePayload, nonce: basePayload.nonce + 1 },
            { ...basePayload, paymentId: 'different-payment' }
        ];

        const baseSignature = signPaymentIntent(basePayload, userKeypair);
        const signatures = new Set<string>([baseSignature.signature]);

        for (const variation of variations) {
            const signature = signPaymentIntent(variation, userKeypair);
            
            // Each variation should produce a different signature
            expect(signatures.has(signature.signature)).toBe(false);
            signatures.add(signature.signature);
        }

        // All signatures should be unique
        expect(signatures.size).toBe(variations.length + 1);
    });

    /**
     * Property: Signature verification should fail for tampered payloads
     */
    it('Property 6: Signature verification should fail for tampered data', async () => {
        const originalPayload = {
            paymentId: 'tamper-test',
            payer: userKeypair.publicKey.toBase58(),
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amount: '50000',
            tokenMint: testConfig.usdcMint,
            agentId: 'tamper-agent',
            expiresAt: Math.floor((Date.now() + 300000) / 1000),
            nonce: Date.now()
        };

        const signature = signPaymentIntent(originalPayload, userKeypair);

        // Create tampered versions
        const tamperedPayloads = [
            { ...originalPayload, amount: '100000' }, // Changed amount
            { ...originalPayload, recipient: '8yzR2Ze7t8NjH9b9wUUaUxkHLcrfogWqAzqbMSb1vZgP' }, // Changed recipient
            { ...originalPayload, agentId: 'malicious-agent' }, // Changed agent
            { ...originalPayload, nonce: originalPayload.nonce + 1000 } // Changed nonce
        ];

        for (const tamperedPayload of tamperedPayloads) {
            // Verification should fail for tampered data
            const isValid = verifyPaymentSignature(tamperedPayload, signature);
            expect(isValid).toBe(false);
        }

        // Original payload should still verify correctly
        const originalIsValid = verifyPaymentSignature(originalPayload, signature);
        expect(originalIsValid).toBe(true);
    });

    /**
     * Property: Signature format should be consistent across all payments
     */
    it('Property 7: All signatures should follow consistent format', async () => {
        const testCases = Array.from({ length: 10 }, (_, i) => ({
            agentId: `format-test-${i}`,
            amount: 0.01 + (i * 0.01)
        }));

        for (const testCase of testCases) {
            const paymentResult = await client.createGaslessPayment({
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: testCase.amount,
                agentId: testCase.agentId
            });

            const payload = paymentResult.payload.payload as GaslessPaymentPayload;
            const signature = payload.paymentIntentSignature!.signature;
            
            // Verify signature is valid base64
            expect(() => Buffer.from(signature, 'base64')).not.toThrow();
            
            // Verify signature length (should be 64 bytes for ed25519)
            const signatureBytes = Buffer.from(signature, 'base64');
            expect(signatureBytes.length).toBe(64);
            
            // Verify signature contains no invalid characters
            expect(signature).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
            
            // Verify signature is not empty
            expect(signature.length).toBeGreaterThan(0);
        }
    });

    /**
     * Property: Signature creation should not require network access
     */
    it('Property 8: Signature creation should be offline operation', async () => {
        // This test verifies that signature creation is purely local
        // and doesn't require network access or blockchain interaction
        
        const startTime = Date.now();
        
        const paymentResult = await client.createGaslessPayment({
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amountUsdc: 0.05,
            agentId: 'offline-test'
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Signature creation should be very fast (< 100ms) since it's offline
        expect(duration).toBeLessThan(100);
        
        const payload = paymentResult.payload.payload as GaslessPaymentPayload;
        
        // Verify signature was created
        expect(payload.paymentIntentSignature).toBeDefined();
        expect(payload.paymentIntentSignature!.signature).toBeDefined();
        
        // Verify no blockchain interaction occurred (gasless flag should be true)
        expect(payload.gasless).toBe(true);
        expect(payload.facilitator).toBeDefined();
    });
});