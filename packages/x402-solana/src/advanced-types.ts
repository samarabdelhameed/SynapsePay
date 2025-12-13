/**
 * Advanced X402 Protocol Types for Enhanced Features
 * Supports gasless transactions, robot control, and IoT devices
 */

import { PublicKey } from '@solana/web3.js';
import { X402PaymentPayload, SolanaPaymentPayload } from './types';

// ============================================================================
// Enhanced Payment Types
// ============================================================================

export interface GaslessPaymentPayload extends SolanaPaymentPayload {
    /** Indicates this is a gasless payment */
    gasless: true;
    /** Facilitator that will sponsor the transaction */
    facilitator: string;
    /** Token account delegate signature for gasless execution */
    delegateSignature?: {
        signature: string;
        nonce: number;
        deadline: number;
    };
    /** Pre-signed transaction for facilitator execution */
    preSignedTx?: string;
}

export interface EnhancedX402PaymentPayload extends X402PaymentPayload {
    payload: GaslessPaymentPayload | SolanaPaymentPayload | RobotControlPayload | IoTDevicePayload;
    /** Enhanced features enabled */
    features: {
        gasless?: boolean;
        robotControl?: boolean;
        iotDevice?: boolean;
        multiSig?: boolean;
        emergencyPause?: boolean;
    };
}

// ============================================================================
// Robot Control Types
// ============================================================================

export interface RobotControlPayload extends GaslessPaymentPayload {
    /** Type of device being controlled */
    deviceType: 'robot' | 'drone' | '3d_printer' | 'smart_home' | 'security_camera' | 'industrial';
    /** Device-specific control parameters */
    controlParams: RobotControlParams;
    /** Session duration in seconds */
    sessionDuration: number;
    /** Real-time control endpoint */
    controlEndpoint: string;
    /** Device status monitoring endpoint */
    statusEndpoint?: string;
}

export interface RobotControlParams {
    /** Device unique identifier */
    deviceId: string;
    /** Control commands to execute */
    commands: DeviceCommand[];
    /** Safety parameters */
    safetyLimits?: SafetyLimits;
    /** Quality of service requirements */
    qosRequirements?: QoSRequirements;
}

export interface DeviceCommand {
    /** Command type */
    type: 'move' | 'rotate' | 'activate' | 'deactivate' | 'configure' | 'status' | 'emergency_stop';
    /** Command parameters */
    parameters: Record<string, any>;
    /** Expected execution time in milliseconds */
    executionTime?: number;
    /** Priority level (1-10, 10 being highest) */
    priority?: number;
}

export interface SafetyLimits {
    /** Maximum speed/velocity */
    maxSpeed?: number;
    /** Maximum force/torque */
    maxForce?: number;
    /** Operational boundaries */
    boundaries?: {
        x?: [number, number];
        y?: [number, number];
        z?: [number, number];
    };
    /** Emergency stop conditions */
    emergencyConditions?: string[];
}

export interface QoSRequirements {
    /** Maximum acceptable latency in milliseconds */
    maxLatency: number;
    /** Minimum required bandwidth in kbps */
    minBandwidth?: number;
    /** Required reliability percentage */
    reliability?: number;
}

// ============================================================================
// IoT Device Types
// ============================================================================

export interface IoTDevicePayload extends GaslessPaymentPayload {
    /** IoT device configuration */
    deviceConfig: IoTDeviceConfig;
    /** Communication protocol */
    protocol: 'http' | 'mqtt' | 'websocket' | 'coap';
    /** Device capabilities */
    capabilities: DeviceCapability[];
}

export interface IoTDeviceConfig {
    /** Device manufacturer and model */
    manufacturer: string;
    model: string;
    /** Firmware version */
    firmwareVersion: string;
    /** Network configuration */
    networkConfig: {
        ipAddress?: string;
        port?: number;
        ssl?: boolean;
        authentication?: {
            type: 'none' | 'basic' | 'token' | 'certificate';
            credentials?: Record<string, string>;
        };
    };
}

export interface DeviceCapability {
    /** Capability name */
    name: string;
    /** Capability description */
    description: string;
    /** Input parameters schema */
    inputSchema: Record<string, any>;
    /** Output schema */
    outputSchema: Record<string, any>;
    /** Cost per execution in USDC */
    costPerExecution: number;
    /** Estimated execution time */
    executionTime: number;
}

// ============================================================================
// Security and Multi-Signature Types
// ============================================================================

export interface MultiSigPaymentPayload extends GaslessPaymentPayload {
    /** Multi-signature configuration */
    multiSig: {
        /** Required number of signatures */
        threshold: number;
        /** List of authorized signers */
        signers: string[];
        /** Current signatures */
        signatures: MultiSigSignature[];
        /** Signature deadline */
        deadline: number;
    };
}

export interface MultiSigSignature {
    /** Signer public key */
    signer: string;
    /** Signature data */
    signature: string;
    /** Signature timestamp */
    timestamp: number;
    /** Signature nonce */
    nonce: number;
}

export interface SecurityConfig {
    /** Rate limiting configuration */
    rateLimiting: {
        requestsPerMinute: number;
        requestsPerHour: number;
        burstLimit: number;
        cooldownPeriod: number;
    };
    /** Emergency pause configuration */
    emergencyPause: {
        enabled: boolean;
        triggers: string[];
        pauseDuration: number;
    };
    /** Access control configuration */
    accessControl: {
        whitelist?: string[];
        blacklist?: string[];
        requireKYC?: boolean;
    };
}

// ============================================================================
// Device Session Management
// ============================================================================

export interface DeviceSession {
    /** Session unique identifier */
    sessionId: string;
    /** Device being controlled */
    deviceId: string;
    /** User controlling the device */
    userId: string;
    /** Session start time */
    startTime: number;
    /** Session duration in seconds */
    duration: number;
    /** Current session status */
    status: 'active' | 'paused' | 'completed' | 'expired' | 'terminated';
    /** Total cost accumulated */
    totalCost: number;
    /** Commands executed in this session */
    commandHistory: ExecutedCommand[];
    /** Real-time metrics */
    metrics?: SessionMetrics;
}

export interface ExecutedCommand extends DeviceCommand {
    /** Command execution ID */
    executionId: string;
    /** Execution timestamp */
    executedAt: number;
    /** Execution result */
    result: {
        success: boolean;
        data?: any;
        error?: string;
        executionTime: number;
    };
    /** Cost of this command */
    cost: number;
}

export interface SessionMetrics {
    /** Total commands executed */
    totalCommands: number;
    /** Average response time */
    avgResponseTime: number;
    /** Success rate percentage */
    successRate: number;
    /** Data transferred in bytes */
    dataTransferred: number;
    /** Current latency in milliseconds */
    currentLatency: number;
}

// ============================================================================
// Enhanced Client Configuration
// ============================================================================

export interface AdvancedX402Config {
    /** Base X402 configuration */
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
    
    /** Advanced features configuration */
    features: {
        /** Gasless transaction support */
        gasless: {
            enabled: boolean;
            facilitatorAddress: string;
            maxGasSponsorship: number;
        };
        /** Robot control support */
        robotControl: {
            enabled: boolean;
            maxSessionDuration: number;
            supportedDeviceTypes: string[];
        };
        /** IoT device support */
        iotDevice: {
            enabled: boolean;
            supportedProtocols: string[];
            maxDevicesPerUser: number;
        };
        /** Security features */
        security: SecurityConfig;
    };
    
    /** Device registry configuration */
    deviceRegistry?: {
        registryUrl: string;
        autoDiscovery: boolean;
        trustLevel: 'low' | 'medium' | 'high';
    };
}

// ============================================================================
// Response Types
// ============================================================================

export interface GaslessTransactionResult {
    /** Transaction signature */
    signature: string;
    /** Slot number */
    slot: number;
    /** Gas paid by facilitator */
    gasPaidByFacilitator: number;
    /** User gas cost (should be 0) */
    userGasCost: number;
    /** Transaction status */
    status: 'success' | 'failed' | 'pending';
}

export interface RobotControlResult {
    /** Session information */
    session: DeviceSession;
    /** Control endpoint for real-time commands */
    controlEndpoint: string;
    /** WebSocket URL for real-time updates */
    websocketUrl?: string;
    /** Session token for authentication */
    sessionToken: string;
}

export interface IoTDeviceResult {
    /** Device connection information */
    deviceInfo: {
        deviceId: string;
        status: 'online' | 'offline' | 'busy';
        capabilities: DeviceCapability[];
        lastSeen: number;
    };
    /** Connection endpoints */
    endpoints: {
        control: string;
        status: string;
        stream?: string;
    };
    /** Authentication token */
    authToken: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface X402Error extends Error {
    code: string;
    details?: Record<string, any>;
    recoverable: boolean;
}

export class GaslessTransactionError extends Error implements X402Error {
    code = 'GASLESS_TRANSACTION_ERROR';
    recoverable = true;
    
    constructor(message: string, public details?: Record<string, any>) {
        super(message);
        this.name = 'GaslessTransactionError';
    }
}

export class RobotControlError extends Error implements X402Error {
    code = 'ROBOT_CONTROL_ERROR';
    recoverable = false;
    
    constructor(message: string, public details?: Record<string, any>) {
        super(message);
        this.name = 'RobotControlError';
    }
}

export class IoTDeviceError extends Error implements X402Error {
    code = 'IOT_DEVICE_ERROR';
    recoverable = true;
    
    constructor(message: string, public details?: Record<string, any>) {
        super(message);
        this.name = 'IoTDeviceError';
    }
}

export class SecurityError extends Error implements X402Error {
    code = 'SECURITY_ERROR';
    recoverable = false;
    
    constructor(message: string, public details?: Record<string, any>) {
        super(message);
        this.name = 'SecurityError';
    }
}