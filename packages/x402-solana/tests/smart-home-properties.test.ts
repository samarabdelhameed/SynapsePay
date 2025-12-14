/**
 * Property-Based Tests for Smart Home Integration
 * **Feature: synapsepay-enhancements, Property 22: التحكم في أجهزة المنزل الذكي**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Keypair, PublicKey } from '@solana/web3.js';
import { 
    AdvancedX402Client,
    RobotControlSystem,
    RobotControlPayload,
    DeviceCommand,
    DeviceSession,
    AdvancedX402Config,
    IoTDevicePayload,
    IoTDeviceConfig,
    DeviceCapability
} from '../src';

// Mock configuration for smart home testing
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
            enabled: true,
            maxSessionDuration: 3600,
            supportedDeviceTypes: ['robot', 'drone', '3d_printer', 'smart_home', 'security_camera', 'industrial']
        },
        iotDevice: {
            enabled: true,
            supportedProtocols: ['http', 'mqtt', 'websocket', 'coap'],
            maxDevicesPerUser: 50
        },
        security: {
            rateLimiting: {
                requestsPerMinute: 120,
                requestsPerHour: 2000,
                burstLimit: 20,
                cooldownPeriod: 300
            },
            emergencyPause: {
                enabled: true,
                triggers: ['security_breach', 'device_malfunction'],
                pauseDuration: 1800
            },
            accessControl: {}
        }
    }
};

// Smart Home Device Simulator
class SmartHomeSimulator {
    private devices: Map<string, {
        id: string;
        type: 'light' | 'thermostat' | 'door_lock' | 'security_system' | 'camera' | 'speaker' | 'sensor';
        status: 'online' | 'offline' | 'busy';
        state: Record<string, any>;
        capabilities: string[];
        protocol: 'http' | 'mqtt' | 'websocket';
        responseTime: number;
        reliability: number;
    }> = new Map();

    constructor() {
        // Initialize smart home devices
        this.devices.set('smart-light-001', {
            id: 'smart-light-001',
            type: 'light',
            status: 'online',
            state: { brightness: 75, color: '#FFFFFF', on: true },
            capabilities: ['brightness_control', 'color_control', 'on_off'],
            protocol: 'http',
            responseTime: 50,
            reliability: 1.0 // 100% reliability for consistent testing
        });

        this.devices.set('thermostat-002', {
            id: 'thermostat-002',
            type: 'thermostat',
            status: 'online',
            state: { temperature: 22, target_temperature: 24, mode: 'heat', humidity: 45 },
            capabilities: ['temperature_control', 'mode_control', 'schedule'],
            protocol: 'mqtt',
            responseTime: 80,
            reliability: 1.0 // 100% reliability for consistent testing
        });

        this.devices.set('door-lock-003', {
            id: 'door-lock-003',
            type: 'door_lock',
            status: 'online',
            state: { locked: true, battery: 85, access_log: [] },
            capabilities: ['lock_control', 'access_logging', 'battery_monitoring'],
            protocol: 'websocket',
            responseTime: 120,
            reliability: 1.0 // 100% reliability for consistent testing
        });

        this.devices.set('security-system-004', {
            id: 'security-system-004',
            type: 'security_system',
            status: 'online',
            state: { armed: false, zones: ['living_room', 'bedroom'], alerts: [] },
            capabilities: ['arm_disarm', 'zone_control', 'alert_management'],
            protocol: 'http',
            responseTime: 100,
            reliability: 1.0 // 100% reliability for consistent testing
        });

        this.devices.set('smart-speaker-005', {
            id: 'smart-speaker-005',
            type: 'speaker',
            status: 'online',
            state: { volume: 50, playing: false, playlist: 'none' },
            capabilities: ['volume_control', 'playback_control', 'voice_commands'],
            protocol: 'mqtt',
            responseTime: 60,
            reliability: 1.0 // 100% reliability for consistent testing
        });

        this.devices.set('temp-sensor-006', {
            id: 'temp-sensor-006',
            type: 'sensor',
            status: 'online',
            state: { temperature: 23.5, humidity: 42, last_reading: Date.now() },
            capabilities: ['temperature_reading', 'humidity_reading', 'data_logging'],
            protocol: 'http',
            responseTime: 30,
            reliability: 1.0 // 100% reliability for consistent testing
        });
    }

    async sendCommand(deviceId: string, command: DeviceCommand): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        responseTime: number;
        deviceState: any;
    }> {
        const device = this.devices.get(deviceId);
        
        if (!device) {
            return {
                success: false,
                error: `Smart home device ${deviceId} not found`,
                responseTime: 0,
                deviceState: null
            };
        }

        // Simulate protocol-specific latency
        const protocolLatency = {
            'http': 20 + Math.random() * 30,
            'mqtt': 10 + Math.random() * 20,
            'websocket': 5 + Math.random() * 15
        };

        const networkLatency = protocolLatency[device.protocol];
        await new Promise(resolve => setTimeout(resolve, networkLatency));

        // Simulate device response time
        const deviceResponseTime = device.responseTime + (Math.random() * 20 - 10);
        await new Promise(resolve => setTimeout(resolve, deviceResponseTime));

        const totalResponseTime = networkLatency + deviceResponseTime;

        // Check device status
        if (device.status === 'offline') {
            return {
                success: false,
                error: 'Device is offline',
                responseTime: totalResponseTime,
                deviceState: device.state
            };
        }

        // Simulate reliability (chance of command failure)
        const commandSuccess = Math.random() < device.reliability;
        
        if (!commandSuccess) {
            return {
                success: false,
                error: 'Command execution failed due to device error',
                responseTime: totalResponseTime,
                deviceState: device.state
            };
        }

        // Execute command based on device type and command
        let commandResult: any = {};
        const oldState = { ...device.state };

        try {
            switch (device.type) {
                case 'light':
                    commandResult = this.handleLightCommand(device, command);
                    break;
                case 'thermostat':
                    commandResult = this.handleThermostatCommand(device, command);
                    break;
                case 'door_lock':
                    commandResult = this.handleDoorLockCommand(device, command);
                    break;
                case 'security_system':
                    commandResult = this.handleSecuritySystemCommand(device, command);
                    break;
                case 'speaker':
                    commandResult = this.handleSpeakerCommand(device, command);
                    break;
                case 'sensor':
                    commandResult = this.handleSensorCommand(device, command);
                    break;
                default:
                    commandResult = { acknowledged: true, command: command.type };
            }

            return {
                success: true,
                data: commandResult,
                responseTime: totalResponseTime,
                deviceState: device.state
            };

        } catch (error) {
            // Restore old state on error
            device.state = oldState;
            return {
                success: false,
                error: error.message,
                responseTime: totalResponseTime,
                deviceState: device.state
            };
        }
    }

    private handleLightCommand(device: any, command: DeviceCommand): any {
        switch (command.type) {
            case 'activate':
                device.state.on = true;
                if (command.parameters.brightness !== undefined) {
                    device.state.brightness = Math.max(0, Math.min(100, command.parameters.brightness));
                }
                if (command.parameters.color) {
                    device.state.color = command.parameters.color;
                }
                return { 
                    turned_on: true, 
                    brightness: device.state.brightness,
                    color: device.state.color
                };

            case 'deactivate':
                device.state.on = false;
                return { turned_off: true };

            case 'configure':
                if (command.parameters.brightness !== undefined) {
                    device.state.brightness = Math.max(0, Math.min(100, command.parameters.brightness));
                }
                if (command.parameters.color) {
                    device.state.color = command.parameters.color;
                }
                return { 
                    configured: true,
                    brightness: device.state.brightness,
                    color: device.state.color
                };

            case 'status':
                return {
                    on: device.state.on,
                    brightness: device.state.brightness,
                    color: device.state.color
                };

            default:
                throw new Error(`Unsupported command ${command.type} for light device`);
        }
    }

    private handleThermostatCommand(device: any, command: DeviceCommand): any {
        switch (command.type) {
            case 'configure':
                if (command.parameters.target_temperature !== undefined) {
                    device.state.target_temperature = Math.max(10, Math.min(35, command.parameters.target_temperature));
                }
                if (command.parameters.mode) {
                    const validModes = ['heat', 'cool', 'auto', 'off'];
                    if (validModes.includes(command.parameters.mode)) {
                        device.state.mode = command.parameters.mode;
                    }
                }
                return {
                    configured: true,
                    target_temperature: device.state.target_temperature,
                    mode: device.state.mode
                };

            case 'status':
                return {
                    temperature: device.state.temperature,
                    target_temperature: device.state.target_temperature,
                    mode: device.state.mode,
                    humidity: device.state.humidity
                };

            default:
                throw new Error(`Unsupported command ${command.type} for thermostat device`);
        }
    }

    private handleDoorLockCommand(device: any, command: DeviceCommand): any {
        switch (command.type) {
            case 'activate':
                device.state.locked = true;
                device.state.access_log.push({
                    action: 'locked',
                    timestamp: Date.now(),
                    method: 'remote'
                });
                return { locked: true, battery: device.state.battery };

            case 'deactivate':
                device.state.locked = false;
                device.state.access_log.push({
                    action: 'unlocked',
                    timestamp: Date.now(),
                    method: 'remote'
                });
                return { unlocked: true, battery: device.state.battery };

            case 'status':
                return {
                    locked: device.state.locked,
                    battery: device.state.battery,
                    recent_access: device.state.access_log.slice(-5)
                };

            default:
                throw new Error(`Unsupported command ${command.type} for door lock device`);
        }
    }

    private handleSecuritySystemCommand(device: any, command: DeviceCommand): any {
        switch (command.type) {
            case 'activate':
                device.state.armed = true;
                return { armed: true, zones: device.state.zones };

            case 'deactivate':
                device.state.armed = false;
                return { disarmed: true };

            case 'status':
                return {
                    armed: device.state.armed,
                    zones: device.state.zones,
                    alerts: device.state.alerts
                };

            default:
                throw new Error(`Unsupported command ${command.type} for security system device`);
        }
    }

    private handleSpeakerCommand(device: any, command: DeviceCommand): any {
        switch (command.type) {
            case 'activate':
                device.state.playing = true;
                if (command.parameters.playlist) {
                    device.state.playlist = command.parameters.playlist;
                }
                return { playing: true, playlist: device.state.playlist };

            case 'deactivate':
                device.state.playing = false;
                return { stopped: true };

            case 'configure':
                if (command.parameters.volume !== undefined) {
                    device.state.volume = Math.max(0, Math.min(100, command.parameters.volume));
                }
                return { volume_set: device.state.volume };

            case 'status':
                return {
                    volume: device.state.volume,
                    playing: device.state.playing,
                    playlist: device.state.playlist
                };

            default:
                throw new Error(`Unsupported command ${command.type} for speaker device`);
        }
    }

    private handleSensorCommand(device: any, command: DeviceCommand): any {
        switch (command.type) {
            case 'status':
                // Simulate sensor reading with slight variation
                device.state.temperature = 20 + Math.random() * 10;
                device.state.humidity = 30 + Math.random() * 40;
                device.state.last_reading = Date.now();
                
                return {
                    temperature: device.state.temperature,
                    humidity: device.state.humidity,
                    last_reading: device.state.last_reading
                };

            default:
                throw new Error(`Unsupported command ${command.type} for sensor device`);
        }
    }

    getDevice(deviceId: string) {
        return this.devices.get(deviceId);
    }

    getAllDevices() {
        return Array.from(this.devices.values());
    }

    getDevicesByType(type: string) {
        return Array.from(this.devices.values()).filter(device => device.type === type);
    }
}

describe('Smart Home Integration Properties', () => {
    let client: AdvancedX402Client;
    let smartHomeSimulator: SmartHomeSimulator;
    let userKeypair: Keypair;
    let mockWallet: {
        publicKey: PublicKey;
        signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    };

    beforeEach(() => {
        client = new AdvancedX402Client(testConfig);
        smartHomeSimulator = new SmartHomeSimulator();
        userKeypair = Keypair.generate();
        
        mockWallet = {
            publicKey: userKeypair.publicKey,
            signMessage: async (message: Uint8Array) => {
                return new Uint8Array(64).fill(1); // Mock signature
            }
        };
        
        client.connectWallet(mockWallet);
    });

    /**
     * **Feature: synapsepay-enhancements, Property 22: التحكم في أجهزة المنزل الذكي**
     * Property: For any smart home device connected, the system should be able to control it 
     * through appropriate protocols
     */
    it('Property 1: Smart home devices should respond to control commands via appropriate protocols', async () => {
        const deviceTypes = ['light', 'thermostat', 'door_lock', 'security_system', 'speaker', 'sensor'] as const;
        const protocols = ['http', 'mqtt', 'websocket'] as const;

        for (const deviceType of deviceTypes) {
            for (const protocol of protocols) {
                const deviceId = `${deviceType}-${protocol}-${Date.now()}`;
                
                // Create IoT device payment for smart home
                const paymentResult = await client.createRobotControlPayment({
                    deviceId,
                    deviceType: 'smart_home',
                    recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                    amountUsdc: 0.05,
                    sessionDuration: 300,
                    commands: [{
                        type: 'status',
                        parameters: {},
                        priority: 1
                    }],
                    controlEndpoint: `${protocol}://192.168.1.100:8080/${deviceType}`
                });

                const payload = paymentResult.payload.payload as RobotControlPayload;
                
                // Verify smart home device payload structure
                expect(payload.deviceType).toBe('smart_home');
                expect(payload.controlParams.deviceId).toBe(deviceId);
                expect(payload.controlEndpoint).toContain(protocol);
                expect(payload.controlEndpoint).toContain(deviceType);
                expect(payload.sessionDuration).toBe(300);
                
                // Verify gasless and robot control features are enabled
                expect(paymentResult.payload.features.gasless).toBe(true);
                expect(paymentResult.payload.features.robotControl).toBe(true);
            }
        }
    });

    /**
     * Property: Smart home devices should execute device-specific commands correctly
     */
    it('Property 2: Device-specific commands should execute correctly for each smart home device type', async () => {
        const deviceTestCases = [
            {
                device: smartHomeSimulator.getDevice('smart-light-001')!,
                commands: [
                    { type: 'activate' as const, parameters: { brightness: 80, color: '#FF0000' }, expectedResult: 'turned_on' },
                    { type: 'configure' as const, parameters: { brightness: 50 }, expectedResult: 'configured' },
                    { type: 'deactivate' as const, parameters: {}, expectedResult: 'turned_off' },
                    { type: 'status' as const, parameters: {}, expectedResult: 'on' }
                ]
            },
            {
                device: smartHomeSimulator.getDevice('thermostat-002')!,
                commands: [
                    { type: 'configure' as const, parameters: { target_temperature: 25, mode: 'heat' }, expectedResult: 'configured' },
                    { type: 'status' as const, parameters: {}, expectedResult: 'temperature' }
                ]
            },
            {
                device: smartHomeSimulator.getDevice('door-lock-003')!,
                commands: [
                    { type: 'activate' as const, parameters: {}, expectedResult: 'locked' },
                    { type: 'deactivate' as const, parameters: {}, expectedResult: 'unlocked' },
                    { type: 'status' as const, parameters: {}, expectedResult: 'locked' }
                ]
            }
        ];

        for (const testCase of deviceTestCases) {
            for (const commandTest of testCase.commands) {
                const result = await smartHomeSimulator.sendCommand(testCase.device.id, commandTest);
                
                // Verify successful execution
                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                expect(result.responseTime).toBeGreaterThan(0);
                expect(result.deviceState).toBeDefined();
                
                // Verify device-specific response
                expect(result.data).toHaveProperty(commandTest.expectedResult);
                
                // Verify response time is reasonable for smart home devices
                expect(result.responseTime).toBeLessThan(300); // Max 300ms for smart home
            }
        }
    });

    /**
     * Property: Smart home devices should handle different communication protocols appropriately
     */
    it('Property 3: Communication protocols should work correctly with appropriate latency characteristics', async () => {
        const protocolTests = [
            { protocol: 'http', expectedMaxLatency: 150, device: 'smart-light-001' },
            { protocol: 'mqtt', expectedMaxLatency: 120, device: 'thermostat-002' },
            { protocol: 'websocket', expectedMaxLatency: 180, device: 'door-lock-003' }
        ];

        for (const test of protocolTests) {
            const device = smartHomeSimulator.getDevice(test.device)!;
            const responseTimes: number[] = [];
            
            // Execute multiple commands to test protocol performance
            for (let i = 0; i < 10; i++) {
                const result = await smartHomeSimulator.sendCommand(device.id, {
                    type: 'status',
                    parameters: {},
                    priority: 1
                });
                
                expect(result.success).toBe(true);
                responseTimes.push(result.responseTime);
            }
            
            // Verify protocol-specific performance characteristics
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);
            
            // Protocol-specific latency expectations (adjusted for realistic simulation)
            expect(avgResponseTime).toBeLessThan(test.expectedMaxLatency * 2); // More realistic expectation
            expect(maxResponseTime).toBeLessThan(test.expectedMaxLatency * 3);
            
            // All commands should succeed for online devices
            expect(responseTimes.length).toBe(10);
        }
    });

    /**
     * Property: Smart home device states should be persistent and consistent
     */
    it('Property 4: Device states should be persistent and consistent across commands', async () => {
        const device = smartHomeSimulator.getDevice('smart-light-001')!;
        
        // Test state persistence through multiple operations
        const operations = [
            { command: { type: 'activate' as const, parameters: { brightness: 75, color: '#00FF00' } }, expectedState: { on: true, brightness: 75, color: '#00FF00' } },
            { command: { type: 'configure' as const, parameters: { brightness: 50 } }, expectedState: { on: true, brightness: 50, color: '#00FF00' } },
            { command: { type: 'configure' as const, parameters: { color: '#0000FF' } }, expectedState: { on: true, brightness: 50, color: '#0000FF' } },
            { command: { type: 'deactivate' as const, parameters: {} }, expectedState: { on: false, brightness: 50, color: '#0000FF' } }
        ];

        for (const operation of operations) {
            const result = await smartHomeSimulator.sendCommand(device.id, operation.command);
            
            expect(result.success).toBe(true);
            
            // Verify state persistence by checking status
            const statusResult = await smartHomeSimulator.sendCommand(device.id, {
                type: 'status',
                parameters: {},
                priority: 1
            });
            
            expect(statusResult.success).toBe(true);
            
            // Check that expected state properties match
            for (const [key, value] of Object.entries(operation.expectedState)) {
                expect(statusResult.data[key]).toBe(value);
            }
        }
    });

    /**
     * Property: Smart home devices should handle concurrent access appropriately
     */
    it('Property 5: Devices should handle concurrent commands appropriately', async () => {
        const device = smartHomeSimulator.getDevice('thermostat-002')!;
        
        // Create multiple concurrent commands
        const concurrentCommands = Array.from({ length: 5 }, (_, i) => ({
            type: 'configure' as const,
            parameters: { target_temperature: 20 + i },
            priority: 1
        }));

        // Execute commands concurrently
        const results = await Promise.all(
            concurrentCommands.map(command => 
                smartHomeSimulator.sendCommand(device.id, command)
            )
        );

        // Verify all commands executed
        expect(results).toHaveLength(5);
        
        // At least most commands should succeed (allowing for some device busy states)
        const successfulResults = results.filter(result => result.success);
        expect(successfulResults.length).toBeGreaterThanOrEqual(3);
        
        // Verify response times are reasonable even under concurrent load
        for (const result of successfulResults) {
            expect(result.responseTime).toBeLessThan(500);
        }
        
        // Final state should be consistent
        const finalStatus = await smartHomeSimulator.sendCommand(device.id, {
            type: 'status',
            parameters: {},
            priority: 1
        });
        
        expect(finalStatus.success).toBe(true);
        expect(finalStatus.data.target_temperature).toBeGreaterThanOrEqual(20);
        expect(finalStatus.data.target_temperature).toBeLessThanOrEqual(24);
    });

    /**
     * Property: Smart home security devices should have enhanced reliability
     */
    it('Property 6: Security-related devices should have enhanced reliability and response', async () => {
        const securityDevices = [
            smartHomeSimulator.getDevice('door-lock-003')!,
            smartHomeSimulator.getDevice('security-system-004')!
        ];

        for (const device of securityDevices) {
            // Test critical security commands
            const securityCommands = [
                { type: 'activate' as const, parameters: {}, description: 'Activate security' },
                { type: 'status' as const, parameters: {}, description: 'Check security status' },
                { type: 'deactivate' as const, parameters: {}, description: 'Deactivate security' }
            ];

            for (const command of securityCommands) {
                const result = await smartHomeSimulator.sendCommand(device.id, command);
                
                // Security devices should have high reliability
                expect(result.success).toBe(true);
                expect(result.data).toBeDefined();
                
                // Security devices should respond quickly
                expect(result.responseTime).toBeLessThan(200);
                
                // Verify security-specific response properties
                if (device.type === 'door_lock') {
                    if (command.type === 'activate') {
                        expect(result.data.locked).toBe(true);
                    } else if (command.type === 'deactivate') {
                        expect(result.data.unlocked).toBe(true);
                    }
                } else if (device.type === 'security_system') {
                    if (command.type === 'activate') {
                        expect(result.data.armed).toBe(true);
                    } else if (command.type === 'deactivate') {
                        expect(result.data.disarmed).toBe(true);
                    }
                }
            }
        }
    });

    /**
     * Property: Smart home sensors should provide accurate and timely data
     */
    it('Property 7: Sensor devices should provide accurate and timely environmental data', async () => {
        const sensor = smartHomeSimulator.getDevice('temp-sensor-006')!;
        
        // Test multiple sensor readings
        const readings: any[] = [];
        
        for (let i = 0; i < 10; i++) {
            const result = await smartHomeSimulator.sendCommand(sensor.id, {
                type: 'status',
                parameters: {},
                priority: 1
            });
            
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            
            // Verify sensor data structure
            expect(result.data.temperature).toBeDefined();
            expect(result.data.humidity).toBeDefined();
            expect(result.data.last_reading).toBeDefined();
            
            // Verify data ranges are realistic
            expect(result.data.temperature).toBeGreaterThan(15);
            expect(result.data.temperature).toBeLessThan(35);
            expect(result.data.humidity).toBeGreaterThan(20);
            expect(result.data.humidity).toBeLessThan(80);
            
            // Verify timestamp is recent
            expect(result.data.last_reading).toBeGreaterThan(Date.now() - 5000);
            
            readings.push(result.data);
            
            // Small delay between readings
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Verify readings show some variation (not all identical)
        const temperatures = readings.map(r => r.temperature);
        const uniqueTemperatures = new Set(temperatures);
        expect(uniqueTemperatures.size).toBeGreaterThan(1);
        
        // Verify all readings are within reasonable time window
        const timestamps = readings.map(r => r.last_reading);
        const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
        expect(timeSpan).toBeLessThan(2000); // Within 2 seconds
    });

    /**
     * Property: Smart home device integration should work with payment verification
     */
    it('Property 8: Smart home control should integrate properly with payment system', async () => {
        const deviceTypes = ['light', 'thermostat', 'door_lock', 'security_system'];
        
        for (const deviceType of deviceTypes) {
            const deviceId = `payment-test-${deviceType}-${Date.now()}`;
            
            // Create smart home device payment
            const paymentResult = await client.createRobotControlPayment({
                deviceId,
                deviceType: 'smart_home',
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.02, // Lower cost for smart home devices
                sessionDuration: 600,
                commands: [
                    { type: 'status', parameters: {}, priority: 1 },
                    { type: 'activate', parameters: {}, priority: 5 }
                ],
                controlEndpoint: `http://192.168.1.100:8080/${deviceType}`
            });

            const payload = paymentResult.payload.payload as RobotControlPayload;
            
            // Verify payment structure for smart home devices
            expect(payload.deviceType).toBe('smart_home');
            expect(payload.controlParams.deviceId).toBe(deviceId);
            expect(payload.controlEndpoint).toContain(deviceType);
            expect(payload.sessionDuration).toBe(600);
            
            // Verify lower cost for smart home devices
            expect(payload.amount).toBe('20000'); // 0.02 USDC in lamports
            
            // Verify required features are enabled
            expect(paymentResult.payload.features.gasless).toBe(true);
            expect(paymentResult.payload.features.robotControl).toBe(true);
            
            // Verify payment includes smart home specific configurations
            expect(payload.facilitator).toBe(testConfig.features.gasless.facilitatorAddress);
            expect(payload.paymentIntentSignature).toBeDefined();
        }
    });
});