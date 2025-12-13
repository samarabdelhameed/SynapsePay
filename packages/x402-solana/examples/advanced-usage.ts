/**
 * Advanced X402 Protocol Usage Examples
 * Demonstrates gasless transactions, robot control, IoT devices, and multi-signature
 */

import { PublicKey, Keypair } from '@solana/web3.js';
import { 
    AdvancedX402Client,
    AdvancedX402Config,
    EnhancedX402Middleware,
    GaslessTransactionEngine,
    RobotControlSystem
} from '../src';

// ============================================================================
// Configuration
// ============================================================================

const config: AdvancedX402Config = {
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
            maxGasSponsorship: 1000000 // 1 USDC worth of gas
        },
        robotControl: {
            enabled: true,
            maxSessionDuration: 3600, // 1 hour
            supportedDeviceTypes: ['robot', 'drone', '3d_printer', 'smart_home']
        },
        iotDevice: {
            enabled: true,
            supportedProtocols: ['http', 'mqtt', 'websocket'],
            maxDevicesPerUser: 10
        },
        security: {
            rateLimiting: {
                requestsPerMinute: 60,
                requestsPerHour: 1000,
                burstLimit: 10,
                cooldownPeriod: 300
            },
            emergencyPause: {
                enabled: true,
                triggers: ['security_breach', 'system_overload'],
                pauseDuration: 3600
            },
            accessControl: {
                requireKYC: false
            }
        }
    }
};

// ============================================================================
// Example 1: Gasless AI Agent Payment
// ============================================================================

async function exampleGaslessAIPayment() {
    console.log('🚀 Example 1: Gasless AI Agent Payment');
    
    const client = new AdvancedX402Client(config);
    
    // Mock wallet (in real app, use actual wallet)
    const userKeypair = Keypair.generate();
    const wallet = {
        publicKey: userKeypair.publicKey,
        signMessage: async (message: Uint8Array) => {
            // In real implementation, this would prompt user to sign
            return new Uint8Array(64); // Mock signature
        }
    };
    
    client.connectWallet(wallet);
    
    try {
        // Create gasless payment for AI agent
        const paymentResult = await client.createGaslessPayment({
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amountUsdc: 0.05, // 5 cents for PDF summary
            agentId: 'pdf-summarizer-v1',
            taskMetadata: {
                taskType: 'pdf_summary',
                inputFile: 'document.pdf',
                maxLength: 500
            }
        });
        
        console.log('✅ Gasless payment created:', {
            paymentId: paymentResult.paymentId,
            features: paymentResult.payload.features
        });
        
        // Use payment header in API call
        const response = await fetch('http://localhost:8404/agent/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-PAYMENT': paymentResult.paymentHeader
            },
            body: JSON.stringify({
                agentId: 'pdf-summarizer-v1',
                task: 'summarize',
                input: 'document.pdf'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('🤖 AI Agent Result:', result);
        }
        
    } catch (error) {
        console.error('❌ Gasless payment failed:', error);
    }
}

// ============================================================================
// Example 2: Robot Control Session
// ============================================================================

async function exampleRobotControl() {
    console.log('🤖 Example 2: Robot Control Session');
    
    const client = new AdvancedX402Client(config);
    
    // Mock wallet
    const userKeypair = Keypair.generate();
    const wallet = {
        publicKey: userKeypair.publicKey,
        signMessage: async (message: Uint8Array) => new Uint8Array(64)
    };
    
    client.connectWallet(wallet);
    
    try {
        // Create robot control payment
        const paymentResult = await client.createRobotControlPayment({
            deviceId: 'robot-arm-001',
            deviceType: 'robot',
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amountUsdc: 0.10, // 10 cents for 10 minutes
            sessionDuration: 600, // 10 minutes
            commands: [
                {
                    type: 'move',
                    parameters: { x: 100, y: 50, z: 25, speed: 50 },
                    priority: 5
                },
                {
                    type: 'activate',
                    parameters: { tool: 'gripper', force: 30 },
                    priority: 7
                }
            ],
            controlEndpoint: 'http://192.168.1.100:5000/control',
            safetyLimits: {
                maxSpeed: 100,
                maxForce: 50,
                boundaries: {
                    x: [0, 200],
                    y: [0, 200],
                    z: [0, 100]
                }
            }
        });
        
        console.log('🤖 Robot control payment created:', paymentResult.paymentId);
        
        // Initialize robot session (after payment verification)
        const mockRobotPayload = paymentResult.payload.payload as any;
        const sessionResult = await client.initializeRobotControl(mockRobotPayload, true);
        
        console.log('🎮 Robot session initialized:', {
            sessionId: sessionResult.session.sessionId,
            controlEndpoint: sessionResult.controlEndpoint,
            websocketUrl: sessionResult.websocketUrl
        });
        
        // Execute commands
        for (const command of mockRobotPayload.controlParams.commands) {
            const executedCommand = await client.executeRobotCommand(
                sessionResult.session.sessionId,
                command
            );
            
            console.log('⚡ Command executed:', {
                type: executedCommand.type,
                success: executedCommand.result.success,
                cost: executedCommand.cost,
                executionTime: executedCommand.result.executionTime
            });
        }
        
        // Get session info
        const sessionInfo = client.getRobotSession(sessionResult.session.sessionId);
        console.log('📊 Session metrics:', sessionInfo?.metrics);
        
    } catch (error) {
        console.error('❌ Robot control failed:', error);
    }
}

// ============================================================================
// Example 3: IoT Device Control
// ============================================================================

async function exampleIoTDevice() {
    console.log('🏠 Example 3: IoT Device Control');
    
    const client = new AdvancedX402Client(config);
    
    // Mock wallet
    const userKeypair = Keypair.generate();
    const wallet = {
        publicKey: userKeypair.publicKey,
        signMessage: async (message: Uint8Array) => new Uint8Array(64)
    };
    
    client.connectWallet(wallet);
    
    try {
        // Create IoT device payment
        const paymentResult = await client.createIoTDevicePayment({
            deviceId: 'smart-thermostat-001',
            manufacturer: 'SmartHome Inc',
            model: 'ThermoStat Pro',
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amountUsdc: 0.02, // 2 cents per command
            protocol: 'http',
            capabilities: [
                {
                    name: 'setTemperature',
                    description: 'Set target temperature',
                    inputSchema: { temperature: 'number', unit: 'string' },
                    outputSchema: { success: 'boolean', currentTemp: 'number' },
                    costPerExecution: 0.01,
                    executionTime: 2000
                },
                {
                    name: 'getStatus',
                    description: 'Get current status',
                    inputSchema: {},
                    outputSchema: { temperature: 'number', humidity: 'number', mode: 'string' },
                    costPerExecution: 0.005,
                    executionTime: 1000
                }
            ],
            networkConfig: {
                ipAddress: '192.168.1.50',
                port: 8080,
                ssl: false,
                authentication: {
                    type: 'token',
                    credentials: { token: 'device-token-123' }
                }
            }
        });
        
        console.log('🏠 IoT device payment created:', paymentResult.paymentId);
        
        // Simulate device control
        console.log('🌡️ Controlling smart thermostat...');
        console.log('📡 Device capabilities:', paymentResult.payload.payload.capabilities);
        
    } catch (error) {
        console.error('❌ IoT device control failed:', error);
    }
}

// ============================================================================
// Example 4: Multi-Signature Payment
// ============================================================================

async function exampleMultiSigPayment() {
    console.log('👥 Example 4: Multi-Signature Payment');
    
    const client = new AdvancedX402Client(config);
    
    // Mock wallet
    const userKeypair = Keypair.generate();
    const wallet = {
        publicKey: userKeypair.publicKey,
        signMessage: async (message: Uint8Array) => new Uint8Array(64)
    };
    
    client.connectWallet(wallet);
    
    try {
        // Create multi-sig payment (requires 2 out of 3 signatures)
        const paymentResult = await client.createMultiSigPayment({
            recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
            amountUsdc: 1.0, // $1 for high-value operation
            agentId: 'critical-system-v1',
            threshold: 2,
            signers: [
                userKeypair.publicKey.toBase58(),
                'Signer2PublicKey...',
                'Signer3PublicKey...'
            ],
            deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour deadline
        });
        
        console.log('👥 Multi-sig payment created:', {
            paymentId: paymentResult.paymentId,
            threshold: paymentResult.payload.payload.multiSig?.threshold,
            signers: paymentResult.payload.payload.multiSig?.signers.length,
            currentSignatures: paymentResult.payload.payload.multiSig?.signatures.length
        });
        
        console.log('⏳ Waiting for additional signatures...');
        
    } catch (error) {
        console.error('❌ Multi-sig payment failed:', error);
    }
}

// ============================================================================
// Example 5: Enhanced Middleware Usage
// ============================================================================

async function exampleEnhancedMiddleware() {
    console.log('🛡️ Example 5: Enhanced Middleware');
    
    const middleware = new EnhancedX402Middleware({
        facilitatorUrl: 'http://localhost:8403',
        security: config.features.security,
        features: {
            gasless: true,
            robotControl: true,
            iotDevice: true,
            multiSig: true,
            rateLimiting: true,
            emergencyPause: true
        },
        onPaymentRequired: async (agentId: string, paymentType: string) => {
            console.log(`💰 Payment required for ${agentId} (type: ${paymentType})`);
            return {
                amount: '50000', // 0.05 USDC
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                features: ['gasless']
            };
        },
        onSecurityViolation: async (violation: string, context: any) => {
            console.log(`🚨 Security violation: ${violation}`, context);
        }
    });
    
    // Mock request headers
    const mockHeaders = {
        'x-payment': 'base64-encoded-payment-payload...',
        'x-forwarded-for': '192.168.1.100'
    };
    
    // Parse payment header
    const context = middleware.parseEnhancedX402Header(
        mockHeaders,
        '192.168.1.100',
        'user123'
    );
    
    if (context) {
        console.log('🔍 Payment context:', {
            paymentType: context.paymentType,
            isValid: context.isValid,
            features: context.features,
            securityChecks: context.securityChecks
        });
        
        if (context.isValid) {
            const result = await middleware.processEnhancedPayment(context);
            console.log('✅ Payment processed:', result);
        }
    }
    
    // Get system status
    const status = middleware.getSystemStatus();
    console.log('📊 System status:', status);
}

// ============================================================================
// Run Examples
// ============================================================================

async function runAllExamples() {
    console.log('🚀 Starting Advanced X402 Protocol Examples\n');
    
    try {
        await exampleGaslessAIPayment();
        console.log('\n' + '='.repeat(60) + '\n');
        
        await exampleRobotControl();
        console.log('\n' + '='.repeat(60) + '\n');
        
        await exampleIoTDevice();
        console.log('\n' + '='.repeat(60) + '\n');
        
        await exampleMultiSigPayment();
        console.log('\n' + '='.repeat(60) + '\n');
        
        await exampleEnhancedMiddleware();
        
        console.log('\n✅ All examples completed successfully!');
        
    } catch (error) {
        console.error('❌ Example execution failed:', error);
    }
}

// Export for use in other files
export {
    exampleGaslessAIPayment,
    exampleRobotControl,
    exampleIoTDevice,
    exampleMultiSigPayment,
    exampleEnhancedMiddleware,
    runAllExamples
};

// Run if this file is executed directly
if (require.main === module) {
    runAllExamples();
}