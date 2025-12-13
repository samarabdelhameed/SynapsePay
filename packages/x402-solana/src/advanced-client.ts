/**
 * Advanced X402 Client with Enhanced Features
 * Supports gasless transactions, robot control, IoT devices, and multi-signature
 */

import { PublicKey, Keypair } from '@solana/web3.js';
import { 
    AdvancedX402Config,
    EnhancedX402PaymentPayload,
    GaslessPaymentPayload,
    RobotControlPayload,
    IoTDevicePayload,
    MultiSigPaymentPayload,
    GaslessTransactionResult,
    RobotControlResult,
    IoTDeviceResult,
    DeviceSession,
    DeviceCommand,
    ExecutedCommand,
    X402Error
} from './advanced-types';
import { GaslessTransactionEngine } from './gasless-engine';
import { RobotControlSystem } from './robot-control';
import { createPayload, encodePayload } from './payload';
import { createSigningMessage } from './signatures';

export class AdvancedX402Client {
    private config: AdvancedX402Config;
    private gaslessEngine?: GaslessTransactionEngine;
    private robotControl?: RobotControlSystem;
    private wallet?: {
        publicKey: PublicKey | null;
        signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
        signTransaction?: (transaction: any) => Promise<any>;
    };

    constructor(config: AdvancedX402Config) {
        this.config = config;
        this.initializeEngines();
    }

    /**
     * Initialize specialized engines based on configuration
     */
    private initializeEngines(): void {
        if (this.config.features.gasless.enabled) {
            this.gaslessEngine = new GaslessTransactionEngine(this.config);
        }

        if (this.config.features.robotControl.enabled) {
            this.robotControl = new RobotControlSystem({
                baseUrl: this.config.resourceServerUrl,
                websocketUrl: this.config.resourceServerUrl.replace('http', 'ws'),
                safety: this.config.features.security.rateLimiting as any, // Simplified for demo
                qos: {
                    maxLatency: 100,
                    minBandwidth: 1000,
                    reliability: 99
                }
            });
        }
    }

    /**
     * Connect wallet for signing operations
     */
    connectWallet(wallet: {
        publicKey: PublicKey | null;
        signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
        signTransaction?: (transaction: any) => Promise<any>;
    }): void {
        this.wallet = wallet;
    }

    // ============================================================================
    // Gasless Payment Methods
    // ============================================================================

    /**
     * Create gasless payment - user signs, facilitator pays gas
     */
    async createGaslessPayment(params: {
        recipient: string;
        amountUsdc: number;
        agentId: string;
        taskMetadata?: Record<string, unknown>;
        durationSeconds?: number;
    }): Promise<{
        paymentHeader: string;
        paymentId: string;
        payload: EnhancedX402PaymentPayload;
    }> {
        if (!this.wallet?.publicKey || !this.wallet.signMessage) {
            throw new Error('Wallet not connected or does not support message signing');
        }

        if (!this.config.features.gasless.enabled) {
            throw new Error('Gasless payments are not enabled');
        }

        try {
            const payer = this.wallet.publicKey.toBase58();
            const paymentId = this.generatePaymentId(payer, params.agentId);
            const amountLamports = Math.floor(params.amountUsdc * 1_000_000);
            const nonce = Date.now();

            // Create gasless payload
            const gaslessPayload: GaslessPaymentPayload = {
                paymentId,
                payer,
                recipient: params.recipient,
                amount: amountLamports.toString(),
                tokenMint: this.config.usdcMint,
                agentId: params.agentId,
                taskMetadata: params.taskMetadata,
                expiresAt: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
                nonce,
                gasless: true,
                facilitator: this.config.features.gasless.facilitatorAddress
            };

            // Create signing message
            const intentMessage = createSigningMessage(gaslessPayload);

            // User signs the intent
            const signatureBytes = await this.wallet.signMessage(intentMessage);
            const signatureBase64 = Buffer.from(signatureBytes).toString('base64');

            // Add signature to payload
            gaslessPayload.paymentIntentSignature = {
                signature: signatureBase64,
                nonce
            };

            // Create enhanced payload
            const enhancedPayload: EnhancedX402PaymentPayload = {
                version: '1.0',
                paymentType: 'solana',
                network: this.config.network,
                payload: gaslessPayload,
                features: {
                    gasless: true
                }
            };

            // Encode for header
            const paymentHeader = encodePayload(enhancedPayload as any);

            return {
                paymentHeader,
                paymentId,
                payload: enhancedPayload
            };
        } catch (error) {
            throw new Error(`Failed to create gasless payment: ${error}`);
        }
    }

    /**
     * Execute gasless payment through facilitator
     */
    async executeGaslessPayment(
        payload: GaslessPaymentPayload,
        userSignature: string
    ): Promise<GaslessTransactionResult> {
        if (!this.gaslessEngine) {
            throw new Error('Gasless engine not initialized');
        }

        return await this.gaslessEngine.createGaslessPayment(payload, userSignature);
    }

    // ============================================================================
    // Robot Control Methods
    // ============================================================================

    /**
     * Create robot control payment and session
     */
    async createRobotControlPayment(params: {
        deviceId: string;
        deviceType: 'robot' | 'drone' | '3d_printer' | 'smart_home' | 'security_camera' | 'industrial';
        recipient: string;
        amountUsdc: number;
        sessionDuration: number;
        commands: DeviceCommand[];
        controlEndpoint: string;
        safetyLimits?: any;
    }): Promise<{
        paymentHeader: string;
        paymentId: string;
        payload: EnhancedX402PaymentPayload;
    }> {
        if (!this.wallet?.publicKey || !this.wallet.signMessage) {
            throw new Error('Wallet not connected');
        }

        if (!this.config.features.robotControl.enabled) {
            throw new Error('Robot control is not enabled');
        }

        try {
            const payer = this.wallet.publicKey.toBase58();
            const paymentId = this.generatePaymentId(payer, params.deviceId);
            const amountLamports = Math.floor(params.amountUsdc * 1_000_000);
            const nonce = Date.now();

            // Create robot control payload
            const robotPayload: RobotControlPayload = {
                paymentId,
                payer,
                recipient: params.recipient,
                amount: amountLamports.toString(),
                tokenMint: this.config.usdcMint,
                agentId: params.deviceId,
                expiresAt: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
                nonce,
                gasless: true,
                facilitator: this.config.features.gasless.facilitatorAddress,
                deviceType: params.deviceType,
                controlParams: {
                    deviceId: params.deviceId,
                    commands: params.commands,
                    safetyLimits: params.safetyLimits
                },
                sessionDuration: params.sessionDuration,
                controlEndpoint: params.controlEndpoint
            };

            // Sign the payload
            const intentMessage = createSigningMessage(robotPayload);
            const signatureBytes = await this.wallet.signMessage(intentMessage);
            const signatureBase64 = Buffer.from(signatureBytes).toString('base64');

            robotPayload.paymentIntentSignature = {
                signature: signatureBase64,
                nonce
            };

            // Create enhanced payload
            const enhancedPayload: EnhancedX402PaymentPayload = {
                version: '1.0',
                paymentType: 'solana',
                network: this.config.network,
                payload: robotPayload,
                features: {
                    gasless: true,
                    robotControl: true
                }
            };

            const paymentHeader = encodePayload(enhancedPayload as any);

            return {
                paymentHeader,
                paymentId,
                payload: enhancedPayload
            };
        } catch (error) {
            throw new Error(`Failed to create robot control payment: ${error}`);
        }
    }

    /**
     * Initialize robot control session after payment
     */
    async initializeRobotControl(
        payload: RobotControlPayload,
        paymentVerified: boolean
    ): Promise<RobotControlResult> {
        if (!this.robotControl) {
            throw new Error('Robot control system not initialized');
        }

        return await this.robotControl.initializeControlSession(payload, paymentVerified);
    }

    /**
     * Execute command on robot
     */
    async executeRobotCommand(
        sessionId: string,
        command: DeviceCommand
    ): Promise<ExecutedCommand> {
        if (!this.robotControl) {
            throw new Error('Robot control system not initialized');
        }

        return await this.robotControl.executeCommand(sessionId, command);
    }

    /**
     * Get robot session information
     */
    getRobotSession(sessionId: string): DeviceSession | undefined {
        if (!this.robotControl) {
            return undefined;
        }

        return this.robotControl.getSession(sessionId);
    }

    /**
     * Emergency stop robot
     */
    async emergencyStopRobot(sessionId: string): Promise<void> {
        if (!this.robotControl) {
            throw new Error('Robot control system not initialized');
        }

        await this.robotControl.emergencyStop(sessionId);
    }

    // ============================================================================
    // IoT Device Methods
    // ============================================================================

    /**
     * Create IoT device control payment
     */
    async createIoTDevicePayment(params: {
        deviceId: string;
        manufacturer: string;
        model: string;
        recipient: string;
        amountUsdc: number;
        protocol: 'http' | 'mqtt' | 'websocket' | 'coap';
        capabilities: any[];
        networkConfig: any;
    }): Promise<{
        paymentHeader: string;
        paymentId: string;
        payload: EnhancedX402PaymentPayload;
    }> {
        if (!this.wallet?.publicKey || !this.wallet.signMessage) {
            throw new Error('Wallet not connected');
        }

        if (!this.config.features.iotDevice.enabled) {
            throw new Error('IoT device control is not enabled');
        }

        try {
            const payer = this.wallet.publicKey.toBase58();
            const paymentId = this.generatePaymentId(payer, params.deviceId);
            const amountLamports = Math.floor(params.amountUsdc * 1_000_000);
            const nonce = Date.now();

            // Create IoT device payload
            const iotPayload: IoTDevicePayload = {
                paymentId,
                payer,
                recipient: params.recipient,
                amount: amountLamports.toString(),
                tokenMint: this.config.usdcMint,
                agentId: params.deviceId,
                expiresAt: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
                nonce,
                gasless: true,
                facilitator: this.config.features.gasless.facilitatorAddress,
                deviceConfig: {
                    manufacturer: params.manufacturer,
                    model: params.model,
                    firmwareVersion: '1.0.0',
                    networkConfig: params.networkConfig
                },
                protocol: params.protocol,
                capabilities: params.capabilities
            };

            // Sign the payload
            const intentMessage = createSigningMessage(iotPayload);
            const signatureBytes = await this.wallet.signMessage(intentMessage);
            const signatureBase64 = Buffer.from(signatureBytes).toString('base64');

            iotPayload.paymentIntentSignature = {
                signature: signatureBase64,
                nonce
            };

            // Create enhanced payload
            const enhancedPayload: EnhancedX402PaymentPayload = {
                version: '1.0',
                paymentType: 'solana',
                network: this.config.network,
                payload: iotPayload,
                features: {
                    gasless: true,
                    iotDevice: true
                }
            };

            const paymentHeader = encodePayload(enhancedPayload as any);

            return {
                paymentHeader,
                paymentId,
                payload: enhancedPayload
            };
        } catch (error) {
            throw new Error(`Failed to create IoT device payment: ${error}`);
        }
    }

    // ============================================================================
    // Multi-Signature Methods
    // ============================================================================

    /**
     * Create multi-signature payment
     */
    async createMultiSigPayment(params: {
        recipient: string;
        amountUsdc: number;
        agentId: string;
        threshold: number;
        signers: string[];
        deadline: number;
    }): Promise<{
        paymentHeader: string;
        paymentId: string;
        payload: EnhancedX402PaymentPayload;
    }> {
        if (!this.wallet?.publicKey || !this.wallet.signMessage) {
            throw new Error('Wallet not connected');
        }

        try {
            const payer = this.wallet.publicKey.toBase58();
            const paymentId = this.generatePaymentId(payer, params.agentId);
            const amountLamports = Math.floor(params.amountUsdc * 1_000_000);
            const nonce = Date.now();

            // Create multi-sig payload
            const multiSigPayload: MultiSigPaymentPayload = {
                paymentId,
                payer,
                recipient: params.recipient,
                amount: amountLamports.toString(),
                tokenMint: this.config.usdcMint,
                agentId: params.agentId,
                expiresAt: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
                nonce,
                gasless: true,
                facilitator: this.config.features.gasless.facilitatorAddress,
                multiSig: {
                    threshold: params.threshold,
                    signers: params.signers,
                    signatures: [],
                    deadline: params.deadline
                }
            };

            // Initial signature from current user
            const intentMessage = createSigningMessage(multiSigPayload);
            const signatureBytes = await this.wallet.signMessage(intentMessage);
            const signatureBase64 = Buffer.from(signatureBytes).toString('base64');

            multiSigPayload.multiSig.signatures.push({
                signer: payer,
                signature: signatureBase64,
                timestamp: nonce,
                nonce
            });

            // Create enhanced payload
            const enhancedPayload: EnhancedX402PaymentPayload = {
                version: '1.0',
                paymentType: 'solana',
                network: this.config.network,
                payload: multiSigPayload,
                features: {
                    gasless: true,
                    multiSig: true
                }
            };

            const paymentHeader = encodePayload(enhancedPayload as any);

            return {
                paymentHeader,
                paymentId,
                payload: enhancedPayload
            };
        } catch (error) {
            throw new Error(`Failed to create multi-sig payment: ${error}`);
        }
    }

    // ============================================================================
    // Enhanced Fetch Methods
    // ============================================================================

    /**
     * Fetch with automatic X402 handling and enhanced features
     */
    async fetchWithEnhancedX402(
        url: string,
        options: RequestInit = {},
        paymentParams: {
            type: 'gasless';
            recipient: string;
            amountUsdc: number;
            agentId: string;
            taskMetadata?: Record<string, unknown>;
            durationSeconds?: number;
        } | {
            type: 'robot';
            deviceId: string;
            deviceType: 'robot' | 'drone' | '3d_printer' | 'smart_home' | 'security_camera' | 'industrial';
            recipient: string;
            amountUsdc: number;
            sessionDuration: number;
            commands: DeviceCommand[];
            controlEndpoint: string;
            safetyLimits?: any;
        } | {
            type: 'iot';
            deviceId: string;
            manufacturer: string;
            model: string;
            recipient: string;
            amountUsdc: number;
            protocol: 'http' | 'mqtt' | 'websocket' | 'coap';
            capabilities: any[];
            networkConfig: any;
        } | {
            type: 'multisig';
            recipient: string;
            amountUsdc: number;
            agentId: string;
            threshold: number;
            signers: string[];
            deadline: number;
        }
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

        // 402 received - create appropriate payment type
        let paymentResult;
        
        switch (paymentParams.type) {
            case 'gasless':
                paymentResult = await this.createGaslessPayment(paymentParams);
                break;
            case 'robot':
                paymentResult = await this.createRobotControlPayment(paymentParams);
                break;
            case 'iot':
                paymentResult = await this.createIoTDevicePayment(paymentParams);
                break;
            case 'multisig':
                paymentResult = await this.createMultiSigPayment(paymentParams);
                break;
            default:
                throw new Error(`Unsupported payment type: ${(paymentParams as any).type}`);
        }

        // Retry with payment header
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                'X-PAYMENT': paymentResult.paymentHeader,
            },
        });
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Generate unique payment ID
     */
    private generatePaymentId(payer: string, agentId: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const combined = `${payer.slice(0, 8)}-${agentId.slice(0, 8)}-${timestamp}-${random}`;
        return combined.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    }

    /**
     * Get client configuration
     */
    getConfig(): AdvancedX402Config {
        return { ...this.config };
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature: 'gasless' | 'robotControl' | 'iotDevice'): boolean {
        return this.config.features[feature]?.enabled || false;
    }

    /**
     * Get wallet information
     */
    getWallet(): { connected: boolean; publicKey?: string } {
        return {
            connected: !!this.wallet?.publicKey,
            publicKey: this.wallet?.publicKey?.toBase58()
        };
    }

    /**
     * Disconnect wallet
     */
    disconnectWallet(): void {
        this.wallet = undefined;
    }
}