/**
 * Enhanced X402 Middleware with Advanced Features
 * Supports gasless transactions, robot control, IoT devices, rate limiting, and security
 */

import { 
    EnhancedX402PaymentPayload,
    GaslessPaymentPayload,
    RobotControlPayload,
    IoTDevicePayload,
    MultiSigPaymentPayload,
    SecurityConfig,
    SecurityError,
    X402Error
} from './advanced-types';
import { decodePayload, validatePayload, extractPaymentHeader } from './payload';
import { GaslessTransactionEngine } from './gasless-engine';
import { RobotControlSystem } from './robot-control';

export interface EnhancedX402Context {
    payload: EnhancedX402PaymentPayload;
    paymentType: 'standard' | 'gasless' | 'robot' | 'iot' | 'multisig';
    isValid: boolean;
    errors: string[];
    features: {
        gasless?: boolean;
        robotControl?: boolean;
        iotDevice?: boolean;
        multiSig?: boolean;
    };
    securityChecks: {
        rateLimitPassed: boolean;
        accessControlPassed: boolean;
        emergencyPauseActive: boolean;
    };
}

export interface EnhancedMiddlewareConfig {
    /** Facilitator configuration */
    facilitatorUrl: string;
    facilitatorKeypair?: any; // Keypair for gasless transactions
    
    /** Security configuration */
    security: SecurityConfig;
    
    /** Feature enablement */
    features: {
        gasless: boolean;
        robotControl: boolean;
        iotDevice: boolean;
        multiSig: boolean;
        rateLimiting: boolean;
        emergencyPause: boolean;
    };
    
    /** Rate limiting storage (in production, use Redis or similar) */
    rateLimitStore?: Map<string, { count: number; resetTime: number }>;
    
    /** Emergency pause state */
    emergencyPauseState?: { active: boolean; reason?: string; activatedAt?: number };
    
    /** Custom handlers */
    onPaymentRequired?: (agentId: string, paymentType: string) => Promise<{
        amount: string;
        recipient: string;
        features?: string[];
    }>;
    onSecurityViolation?: (violation: string, context: any) => Promise<void>;
    onEmergencyPause?: (reason: string) => Promise<void>;
}

export class EnhancedX402Middleware {
    private config: EnhancedMiddlewareConfig;
    private gaslessEngine?: GaslessTransactionEngine;
    private robotControl?: RobotControlSystem;
    private rateLimitStore: Map<string, { count: number; resetTime: number }>;
    private emergencyPauseState: { active: boolean; reason?: string; activatedAt?: number };

    constructor(config: EnhancedMiddlewareConfig) {
        this.config = config;
        this.rateLimitStore = config.rateLimitStore || new Map();
        this.emergencyPauseState = config.emergencyPauseState || { active: false };
        
        this.initializeEngines();
    }

    /**
     * Initialize specialized engines
     */
    private initializeEngines(): void {
        if (this.config.features.gasless && this.config.facilitatorKeypair) {
            this.gaslessEngine = new GaslessTransactionEngine(
                {
                    facilitatorUrl: this.config.facilitatorUrl,
                    resourceServerUrl: this.config.facilitatorUrl,
                    network: 'devnet',
                    rpcUrl: 'https://api.devnet.solana.com',
                    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                    programIds: {
                        registry: '',
                        payments: '',
                        scheduler: ''
                    },
                    features: {
                        gasless: {
                            enabled: true,
                            facilitatorAddress: '',
                            maxGasSponsorship: 1000000
                        },
                        robotControl: { enabled: false, maxSessionDuration: 0, supportedDeviceTypes: [] },
                        iotDevice: { enabled: false, supportedProtocols: [], maxDevicesPerUser: 0 },
                        security: this.config.security
                    }
                },
                this.config.facilitatorKeypair
            );
        }

        if (this.config.features.robotControl) {
            this.robotControl = new RobotControlSystem({
                baseUrl: this.config.facilitatorUrl,
                safety: {
                    maxSpeed: 100,
                    maxForce: 50,
                    emergencyConditions: ['high_speed', 'dangerous_position']
                },
                qos: {
                    maxLatency: 100,
                    reliability: 99
                }
            });
        }
    }

    /**
     * Parse and validate enhanced X-PAYMENT header
     */
    parseEnhancedX402Header(
        headers: Record<string, string | undefined>,
        clientIp?: string,
        userId?: string
    ): EnhancedX402Context | null {
        const paymentHeader = extractPaymentHeader(headers);

        if (!paymentHeader) {
            return null;
        }

        try {
            // Decode payload
            const payload = decodePayload(paymentHeader) as EnhancedX402PaymentPayload;
            
            // Basic validation
            const validation = validatePayload(payload as any);
            
            // Determine payment type
            const paymentType = this.determinePaymentType(payload);
            
            // Enhanced validation based on type
            const enhancedValidation = this.validateEnhancedPayload(payload, paymentType);
            
            // Security checks
            const securityChecks = this.performSecurityChecks(clientIp, userId, payload);

            return {
                payload,
                paymentType,
                isValid: validation.valid && enhancedValidation.valid && securityChecks.rateLimitPassed && securityChecks.accessControlPassed && !securityChecks.emergencyPauseActive,
                errors: [...validation.errors, ...enhancedValidation.errors],
                features: payload.features || {},
                securityChecks
            };
        } catch (error) {
            return {
                payload: null as any,
                paymentType: 'standard',
                isValid: false,
                errors: [`Failed to parse enhanced X-PAYMENT header: ${error}`],
                features: {},
                securityChecks: {
                    rateLimitPassed: false,
                    accessControlPassed: false,
                    emergencyPauseActive: false
                }
            };
        }
    }

    /**
     * Determine payment type from payload
     */
    private determinePaymentType(payload: EnhancedX402PaymentPayload): 'standard' | 'gasless' | 'robot' | 'iot' | 'multisig' {
        if (payload.features?.multiSig) return 'multisig';
        if (payload.features?.robotControl) return 'robot';
        if (payload.features?.iotDevice) return 'iot';
        if (payload.features?.gasless) return 'gasless';
        return 'standard';
    }

    /**
     * Enhanced validation based on payment type
     */
    private validateEnhancedPayload(
        payload: EnhancedX402PaymentPayload, 
        paymentType: string
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        switch (paymentType) {
            case 'gasless':
                if (!this.config.features.gasless) {
                    errors.push('Gasless payments are not enabled');
                }
                errors.push(...this.validateGaslessPayload(payload.payload as GaslessPaymentPayload));
                break;

            case 'robot':
                if (!this.config.features.robotControl) {
                    errors.push('Robot control is not enabled');
                }
                errors.push(...this.validateRobotPayload(payload.payload as RobotControlPayload));
                break;

            case 'iot':
                if (!this.config.features.iotDevice) {
                    errors.push('IoT device control is not enabled');
                }
                errors.push(...this.validateIoTPayload(payload.payload as IoTDevicePayload));
                break;

            case 'multisig':
                if (!this.config.features.multiSig) {
                    errors.push('Multi-signature payments are not enabled');
                }
                errors.push(...this.validateMultiSigPayload(payload.payload as MultiSigPaymentPayload));
                break;
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate gasless payment payload
     */
    private validateGaslessPayload(payload: GaslessPaymentPayload): string[] {
        const errors: string[] = [];

        if (!payload.gasless) {
            errors.push('Payload not marked as gasless');
        }

        if (!payload.facilitator) {
            errors.push('Facilitator address required for gasless payments');
        }

        return errors;
    }

    /**
     * Validate robot control payload
     */
    private validateRobotPayload(payload: RobotControlPayload): string[] {
        const errors: string[] = [];

        if (!payload.deviceType) {
            errors.push('Device type is required for robot control');
        }

        if (!payload.controlParams?.deviceId) {
            errors.push('Device ID is required');
        }

        if (!payload.sessionDuration || payload.sessionDuration <= 0) {
            errors.push('Valid session duration is required');
        }

        if (!payload.controlEndpoint) {
            errors.push('Control endpoint is required');
        }

        return errors;
    }

    /**
     * Validate IoT device payload
     */
    private validateIoTPayload(payload: IoTDevicePayload): string[] {
        const errors: string[] = [];

        if (!payload.deviceConfig) {
            errors.push('Device configuration is required');
        }

        if (!payload.protocol) {
            errors.push('Communication protocol is required');
        }

        if (!payload.capabilities || payload.capabilities.length === 0) {
            errors.push('Device capabilities are required');
        }

        return errors;
    }

    /**
     * Validate multi-signature payload
     */
    private validateMultiSigPayload(payload: MultiSigPaymentPayload): string[] {
        const errors: string[] = [];

        if (!payload.multiSig) {
            errors.push('Multi-signature configuration is required');
        } else {
            if (payload.multiSig.threshold <= 0) {
                errors.push('Valid signature threshold is required');
            }

            if (!payload.multiSig.signers || payload.multiSig.signers.length === 0) {
                errors.push('Signers list is required');
            }

            if (payload.multiSig.threshold > payload.multiSig.signers.length) {
                errors.push('Threshold cannot exceed number of signers');
            }

            if (payload.multiSig.deadline < Date.now() / 1000) {
                errors.push('Multi-signature deadline has passed');
            }
        }

        return errors;
    }

    /**
     * Perform security checks
     */
    private performSecurityChecks(
        clientIp?: string,
        userId?: string,
        payload?: EnhancedX402PaymentPayload
    ): {
        rateLimitPassed: boolean;
        accessControlPassed: boolean;
        emergencyPauseActive: boolean;
    } {
        const rateLimitPassed = this.checkRateLimit(clientIp, userId);
        const accessControlPassed = this.checkAccessControl(userId, payload);
        const emergencyPauseActive = this.emergencyPauseState.active;

        return {
            rateLimitPassed,
            accessControlPassed,
            emergencyPauseActive
        };
    }

    /**
     * Check rate limiting
     */
    private checkRateLimit(clientIp?: string, userId?: string): boolean {
        if (!this.config.features.rateLimiting) {
            return true;
        }

        const key = userId || clientIp || 'anonymous';
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute window
        
        const record = this.rateLimitStore.get(key);
        
        if (!record || now > record.resetTime) {
            // New window
            this.rateLimitStore.set(key, {
                count: 1,
                resetTime: now + windowMs
            });
            return true;
        }

        if (record.count >= this.config.security.rateLimiting.requestsPerMinute) {
            return false;
        }

        record.count++;
        return true;
    }

    /**
     * Check access control
     */
    private checkAccessControl(userId?: string, payload?: EnhancedX402PaymentPayload): boolean {
        const accessControl = this.config.security.accessControl;

        // Check whitelist
        if (accessControl.whitelist && accessControl.whitelist.length > 0) {
            if (!userId || !accessControl.whitelist.includes(userId)) {
                return false;
            }
        }

        // Check blacklist
        if (accessControl.blacklist && accessControl.blacklist.length > 0) {
            if (userId && accessControl.blacklist.includes(userId)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Process enhanced payment
     */
    async processEnhancedPayment(context: EnhancedX402Context): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }> {
        if (!context.isValid) {
            return {
                success: false,
                error: `Payment validation failed: ${context.errors.join(', ')}`
            };
        }

        try {
            switch (context.paymentType) {
                case 'gasless':
                    return await this.processGaslessPayment(context.payload.payload as GaslessPaymentPayload);
                
                case 'robot':
                    return await this.processRobotPayment(context.payload.payload as RobotControlPayload);
                
                case 'iot':
                    return await this.processIoTPayment(context.payload.payload as IoTDevicePayload);
                
                case 'multisig':
                    return await this.processMultiSigPayment(context.payload.payload as MultiSigPaymentPayload);
                
                default:
                    return {
                        success: false,
                        error: `Unsupported payment type: ${context.paymentType}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: `Payment processing failed: ${error}`
            };
        }
    }

    /**
     * Process gasless payment
     */
    private async processGaslessPayment(payload: GaslessPaymentPayload): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }> {
        if (!this.gaslessEngine) {
            return { success: false, error: 'Gasless engine not available' };
        }

        try {
            const signature = payload.paymentIntentSignature?.signature;
            if (!signature) {
                return { success: false, error: 'Payment signature required' };
            }

            const result = await this.gaslessEngine.createGaslessPayment(payload, signature);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error?.toString() };
        }
    }

    /**
     * Process robot control payment
     */
    private async processRobotPayment(payload: RobotControlPayload): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }> {
        if (!this.robotControl) {
            return { success: false, error: 'Robot control system not available' };
        }

        try {
            const result = await this.robotControl.initializeControlSession(payload, true);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error?.toString() };
        }
    }

    /**
     * Process IoT device payment
     */
    private async processIoTPayment(payload: IoTDevicePayload): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }> {
        // IoT device processing logic
        try {
            const result = {
                deviceInfo: {
                    deviceId: payload.agentId,
                    status: 'online' as const,
                    capabilities: payload.capabilities,
                    lastSeen: Date.now()
                },
                endpoints: {
                    control: `${this.config.facilitatorUrl}/iot/${payload.agentId}/control`,
                    status: `${this.config.facilitatorUrl}/iot/${payload.agentId}/status`
                },
                authToken: Buffer.from(JSON.stringify({
                    deviceId: payload.agentId,
                    userId: payload.payer,
                    expiresAt: payload.expiresAt
                })).toString('base64')
            };

            return { success: true, result };
        } catch (error) {
            return { success: false, error: error?.toString() };
        }
    }

    /**
     * Process multi-signature payment
     */
    private async processMultiSigPayment(payload: MultiSigPaymentPayload): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }> {
        try {
            // Check if we have enough signatures
            if (payload.multiSig.signatures.length < payload.multiSig.threshold) {
                return {
                    success: false,
                    error: `Insufficient signatures: ${payload.multiSig.signatures.length}/${payload.multiSig.threshold}`
                };
            }

            // Verify all signatures (simplified)
            const validSignatures = payload.multiSig.signatures.filter(sig => 
                payload.multiSig.signers.includes(sig.signer)
            );

            if (validSignatures.length < payload.multiSig.threshold) {
                return {
                    success: false,
                    error: 'Invalid signatures detected'
                };
            }

            const result = {
                paymentId: payload.paymentId,
                signatures: validSignatures.length,
                threshold: payload.multiSig.threshold,
                status: 'approved'
            };

            return { success: true, result };
        } catch (error) {
            return { success: false, error: error?.toString() };
        }
    }

    /**
     * Create enhanced 402 response
     */
    createEnhanced402Response(params: {
        agentId: string;
        paymentType?: 'gasless' | 'robot' | 'iot' | 'multisig';
        amount?: string;
        recipient?: string;
        features?: string[];
        deviceInfo?: any;
    }): Record<string, string> {
        const baseHeaders: Record<string, string> = {
            'X-Payment-Required': 'true',
            'X-Payment-Agent': params.agentId,
            'X-Payment-Type': params.paymentType || 'standard',
            'X-Payment-Network': 'devnet',
            'X-Payment-Expires': (Math.floor(Date.now() / 1000) + 300).toString(),
        };

        if (params.amount) baseHeaders['X-Payment-Amount'] = params.amount;
        if (params.recipient) baseHeaders['X-Payment-Recipient'] = params.recipient;
        if (params.features) baseHeaders['X-Payment-Features'] = params.features.join(',');
        if (params.deviceInfo) baseHeaders['X-Device-Info'] = JSON.stringify(params.deviceInfo);

        return baseHeaders;
    }

    /**
     * Emergency pause system
     */
    async activateEmergencyPause(reason: string): Promise<void> {
        this.emergencyPauseState = {
            active: true,
            reason,
            activatedAt: Date.now()
        };

        if (this.config.onEmergencyPause) {
            await this.config.onEmergencyPause(reason);
        }
    }

    /**
     * Deactivate emergency pause
     */
    deactivateEmergencyPause(): void {
        this.emergencyPauseState = { active: false };
    }

    /**
     * Get system status
     */
    getSystemStatus(): {
        emergencyPause: { active: boolean; reason?: string; activatedAt?: number };
        rateLimitStats: { totalEntries: number };
        features: Record<string, boolean>;
    } {
        return {
            emergencyPause: this.emergencyPauseState,
            rateLimitStats: { totalEntries: this.rateLimitStore.size },
            features: this.config.features
        };
    }
}