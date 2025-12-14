/**
 * IoT Device Management System for X402 Protocol
 * Supports Smart Home, Drone Control, 3D Printers, Security Cameras, and Industrial IoT
 */

import { 
    IoTDevicePayload, 
    IoTDeviceResult, 
    IoTDeviceConfig,
    DeviceCapability,
    DeviceCommand,
    ExecutedCommand,
    IoTDeviceError,
    DeviceSession
} from './advanced-types';

export interface IoTDeviceRegistry {
    deviceId: string;
    deviceType: 'smart_home' | 'drone' | '3d_printer' | 'security_camera' | 'industrial';
    owner: string;
    manufacturer: string;
    model: string;
    capabilities: DeviceCapability[];
    status: 'online' | 'offline' | 'busy' | 'maintenance';
    lastSeen: number;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    pricing: {
        baseRate: number; // USDC per minute
        commandRates: Record<string, number>; // USDC per command type
    };
    networkConfig: {
        protocol: 'http' | 'mqtt' | 'websocket' | 'coap';
        endpoint: string;
        port: number;
        ssl: boolean;
        authentication?: {
            type: 'none' | 'basic' | 'token' | 'certificate';
            credentials?: Record<string, string>;
        };
    };
}

export class IoTDeviceManager {
    private deviceRegistry: Map<string, IoTDeviceRegistry> = new Map();
    private activeSessions: Map<string, DeviceSession> = new Map();
    private deviceConnections: Map<string, any> = new Map(); // Protocol-specific connections

    constructor() {
        this.initializeDeviceTypes();
    }

    /**
     * Initialize supported device types with default configurations
     */
    private initializeDeviceTypes(): void {
        // This would typically load from a configuration file or database
        console.log('IoT Device Manager initialized with support for:');
        console.log('- Smart Home Devices (lights, thermostats, locks, etc.)');
        console.log('- Drone Control Systems');
        console.log('- 3D Printers');
        console.log('- Security Cameras');
        console.log('- Industrial IoT Equipment');
    }

    /**
     * Register a new IoT device
     */
    async registerDevice(deviceConfig: IoTDeviceRegistry): Promise<string> {
        try {
            // Validate device configuration
            await this.validateDeviceConfig(deviceConfig);

            // Test device connectivity
            await this.testDeviceConnectivity(deviceConfig);

            // Store device in registry
            this.deviceRegistry.set(deviceConfig.deviceId, {
                ...deviceConfig,
                status: 'online',
                lastSeen: Date.now()
            });

            console.log(`Device ${deviceConfig.deviceId} registered successfully`);
            return deviceConfig.deviceId;
        } catch (error) {
            throw new IoTDeviceError(
                `Failed to register device: ${error}`,
                { deviceConfig }
            );
        }
    }

    /**
     * Initialize IoT device control session
     */
    async initializeDeviceSession(
        payload: IoTDevicePayload,
        paymentVerified: boolean
    ): Promise<IoTDeviceResult> {
        if (!paymentVerified) {
            throw new IoTDeviceError('Payment not verified for IoT device control');
        }

        try {
            const deviceId = this.extractDeviceId(payload);
            const device = this.deviceRegistry.get(deviceId);

            if (!device) {
                throw new IoTDeviceError(`Device ${deviceId} not found in registry`);
            }

            if (device.status !== 'online') {
                throw new IoTDeviceError(`Device ${deviceId} is not online (status: ${device.status})`);
            }

            // Create device session
            const session = await this.createDeviceSession(payload, device);

            // Establish device connection based on protocol
            const connection = await this.establishDeviceConnection(device);

            // Generate authentication token
            const authToken = this.generateAuthToken(session, device);

            return {
                deviceInfo: {
                    deviceId: device.deviceId,
                    status: device.status,
                    capabilities: device.capabilities,
                    lastSeen: device.lastSeen
                },
                endpoints: {
                    control: `${device.networkConfig.endpoint}/control`,
                    status: `${device.networkConfig.endpoint}/status`,
                    stream: device.deviceType === 'security_camera' 
                        ? `${device.networkConfig.endpoint}/stream` 
                        : undefined
                },
                authToken
            };
        } catch (error) {
            throw new IoTDeviceError(
                `Failed to initialize IoT device session: ${error}`,
                { payload }
            );
        }
    }

    /**
     * Execute command on IoT device
     */
    async executeDeviceCommand(
        sessionId: string,
        command: DeviceCommand
    ): Promise<ExecutedCommand> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new IoTDeviceError('Session not found or expired');
        }

        const device = this.deviceRegistry.get(session.deviceId);
        if (!device) {
            throw new IoTDeviceError('Device not found in registry');
        }

        try {
            // Validate command for device type
            this.validateCommandForDevice(command, device);

            // Execute command based on device type
            const result = await this.executeCommandByDeviceType(device, command);

            // Create executed command record
            const executedCommand: ExecutedCommand = {
                ...command,
                executionId: this.generateExecutionId(),
                executedAt: Math.floor(Date.now() / 1000),
                result,
                cost: this.calculateCommandCost(device, command, result.executionTime)
            };

            // Update session
            session.commandHistory.push(executedCommand);
            session.totalCost += executedCommand.cost;

            return executedCommand;
        } catch (error) {
            throw new IoTDeviceError(
                `Failed to execute device command: ${error}`,
                { sessionId, command }
            );
        }
    }

    /**
     * Execute command based on device type
     */
    private async executeCommandByDeviceType(
        device: IoTDeviceRegistry,
        command: DeviceCommand
    ): Promise<{ success: boolean; data?: any; error?: string; executionTime: number }> {
        const startTime = Date.now();

        try {
            let result: any;

            switch (device.deviceType) {
                case 'smart_home':
                    result = await this.executeSmartHomeCommand(device, command);
                    break;
                case 'drone':
                    result = await this.executeDroneCommand(device, command);
                    break;
                case '3d_printer':
                    result = await this.execute3DPrinterCommand(device, command);
                    break;
                case 'security_camera':
                    result = await this.executeSecurityCameraCommand(device, command);
                    break;
                case 'industrial':
                    result = await this.executeIndustrialCommand(device, command);
                    break;
                default:
                    throw new IoTDeviceError(`Unsupported device type: ${device.deviceType}`);
            }

            return {
                success: true,
                data: result,
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                success: false,
                error: error?.toString(),
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Execute Smart Home device commands
     */
    private async executeSmartHomeCommand(
        device: IoTDeviceRegistry,
        command: DeviceCommand
    ): Promise<any> {
        const { type, parameters } = command;

        switch (type) {
            case 'activate':
                // Turn on lights, unlock doors, etc.
                return await this.sendHttpCommand(device, {
                    action: 'turn_on',
                    device_type: parameters.deviceType || 'light',
                    intensity: parameters.intensity || 100,
                    color: parameters.color
                });

            case 'deactivate':
                // Turn off lights, lock doors, etc.
                return await this.sendHttpCommand(device, {
                    action: 'turn_off',
                    device_type: parameters.deviceType || 'light'
                });

            case 'configure':
                // Set temperature, adjust brightness, etc.
                return await this.sendHttpCommand(device, {
                    action: 'configure',
                    settings: parameters.settings
                });

            case 'status':
                // Get device status
                return await this.sendHttpCommand(device, {
                    action: 'get_status'
                });

            default:
                throw new IoTDeviceError(`Unsupported smart home command: ${type}`);
        }
    }

    /**
     * Execute Drone control commands
     */
    private async executeDroneCommand(
        device: IoTDeviceRegistry,
        command: DeviceCommand
    ): Promise<any> {
        const { type, parameters } = command;

        switch (type) {
            case 'move':
                // Move drone to coordinates
                return await this.sendHttpCommand(device, {
                    action: 'move',
                    coordinates: {
                        x: parameters.x || 0,
                        y: parameters.y || 0,
                        z: parameters.z || 0
                    },
                    speed: parameters.speed || 1
                });

            case 'rotate':
                // Rotate drone
                return await this.sendHttpCommand(device, {
                    action: 'rotate',
                    yaw: parameters.yaw || 0,
                    pitch: parameters.pitch || 0,
                    roll: parameters.roll || 0
                });

            case 'activate':
                // Take off
                return await this.sendHttpCommand(device, {
                    action: 'takeoff',
                    altitude: parameters.altitude || 5
                });

            case 'deactivate':
                // Land
                return await this.sendHttpCommand(device, {
                    action: 'land'
                });

            case 'emergency_stop':
                // Emergency landing
                return await this.sendHttpCommand(device, {
                    action: 'emergency_land'
                });

            default:
                throw new IoTDeviceError(`Unsupported drone command: ${type}`);
        }
    }

    /**
     * Execute 3D Printer commands
     */
    private async execute3DPrinterCommand(
        device: IoTDeviceRegistry,
        command: DeviceCommand
    ): Promise<any> {
        const { type, parameters } = command;

        switch (type) {
            case 'activate':
                // Start printing
                return await this.sendHttpCommand(device, {
                    action: 'start_print',
                    file_url: parameters.fileUrl,
                    settings: {
                        temperature: parameters.temperature || 200,
                        speed: parameters.speed || 50,
                        layer_height: parameters.layerHeight || 0.2
                    }
                });

            case 'deactivate':
                // Stop printing
                return await this.sendHttpCommand(device, {
                    action: 'stop_print'
                });

            case 'configure':
                // Configure printer settings
                return await this.sendHttpCommand(device, {
                    action: 'configure',
                    settings: parameters.settings
                });

            case 'status':
                // Get print status
                return await this.sendHttpCommand(device, {
                    action: 'get_status'
                });

            default:
                throw new IoTDeviceError(`Unsupported 3D printer command: ${type}`);
        }
    }

    /**
     * Execute Security Camera commands
     */
    private async executeSecurityCameraCommand(
        device: IoTDeviceRegistry,
        command: DeviceCommand
    ): Promise<any> {
        const { type, parameters } = command;

        switch (type) {
            case 'activate':
                // Start recording
                return await this.sendHttpCommand(device, {
                    action: 'start_recording',
                    duration: parameters.duration || 3600, // 1 hour default
                    quality: parameters.quality || 'high'
                });

            case 'deactivate':
                // Stop recording
                return await this.sendHttpCommand(device, {
                    action: 'stop_recording'
                });

            case 'move':
                // Pan/tilt camera
                return await this.sendHttpCommand(device, {
                    action: 'move',
                    pan: parameters.pan || 0,
                    tilt: parameters.tilt || 0,
                    zoom: parameters.zoom || 1
                });

            case 'configure':
                // Configure camera settings
                return await this.sendHttpCommand(device, {
                    action: 'configure',
                    settings: {
                        resolution: parameters.resolution || '1080p',
                        fps: parameters.fps || 30,
                        night_vision: parameters.nightVision || false
                    }
                });

            case 'status':
                // Get camera status
                return await this.sendHttpCommand(device, {
                    action: 'get_status'
                });

            default:
                throw new IoTDeviceError(`Unsupported security camera command: ${type}`);
        }
    }

    /**
     * Execute Industrial IoT commands
     */
    private async executeIndustrialCommand(
        device: IoTDeviceRegistry,
        command: DeviceCommand
    ): Promise<any> {
        const { type, parameters } = command;

        switch (type) {
            case 'activate':
                // Start industrial process
                return await this.sendHttpCommand(device, {
                    action: 'start_process',
                    process_id: parameters.processId,
                    parameters: parameters.processParams || {}
                });

            case 'deactivate':
                // Stop industrial process
                return await this.sendHttpCommand(device, {
                    action: 'stop_process',
                    process_id: parameters.processId
                });

            case 'configure':
                // Configure industrial equipment
                return await this.sendHttpCommand(device, {
                    action: 'configure',
                    equipment_id: parameters.equipmentId,
                    settings: parameters.settings
                });

            case 'status':
                // Get equipment status
                return await this.sendHttpCommand(device, {
                    action: 'get_status',
                    equipment_id: parameters.equipmentId
                });

            case 'emergency_stop':
                // Emergency stop
                return await this.sendHttpCommand(device, {
                    action: 'emergency_stop',
                    equipment_id: parameters.equipmentId
                });

            default:
                throw new IoTDeviceError(`Unsupported industrial command: ${type}`);
        }
    }

    /**
     * Send HTTP command to device
     */
    private async sendHttpCommand(device: IoTDeviceRegistry, commandData: any): Promise<any> {
        try {
            const url = `${device.networkConfig.ssl ? 'https' : 'http'}://${device.networkConfig.endpoint}:${device.networkConfig.port}/api/command`;
            
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            // Add authentication if configured
            if (device.networkConfig.authentication?.type === 'token') {
                headers['Authorization'] = `Bearer ${device.networkConfig.authentication.credentials?.token}`;
            } else if (device.networkConfig.authentication?.type === 'basic') {
                const credentials = device.networkConfig.authentication.credentials;
                if (credentials?.username && credentials?.password) {
                    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
                    headers['Authorization'] = `Basic ${auth}`;
                }
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(commandData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            throw new IoTDeviceError(
                `Failed to send HTTP command to device: ${error}`,
                { device: device.deviceId, commandData }
            );
        }
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    private async validateDeviceConfig(config: IoTDeviceRegistry): Promise<void> {
        if (!config.deviceId || !config.deviceType || !config.owner) {
            throw new IoTDeviceError('Missing required device configuration fields');
        }

        if (!['smart_home', 'drone', '3d_printer', 'security_camera', 'industrial'].includes(config.deviceType)) {
            throw new IoTDeviceError(`Unsupported device type: ${config.deviceType}`);
        }

        if (!config.networkConfig.endpoint || !config.networkConfig.port) {
            throw new IoTDeviceError('Missing network configuration');
        }
    }

    private async testDeviceConnectivity(device: IoTDeviceRegistry): Promise<void> {
        try {
            const result = await this.sendHttpCommand(device, { action: 'ping' });
            if (!result || result.status !== 'ok') {
                throw new Error('Device did not respond to ping');
            }
        } catch (error) {
            throw new IoTDeviceError(
                `Device connectivity test failed: ${error}`,
                { deviceId: device.deviceId }
            );
        }
    }

    private extractDeviceId(payload: IoTDevicePayload): string {
        // Extract device ID from payload - implementation depends on payload structure
        return payload.deviceConfig.manufacturer + '_' + payload.deviceConfig.model + '_' + Date.now();
    }

    private async createDeviceSession(
        payload: IoTDevicePayload,
        device: IoTDeviceRegistry
    ): Promise<DeviceSession> {
        const sessionId = this.generateSessionId(device.deviceId);
        const session: DeviceSession = {
            sessionId,
            deviceId: device.deviceId,
            userId: payload.payer,
            startTime: Math.floor(Date.now() / 1000),
            duration: 3600, // 1 hour default
            status: 'active',
            totalCost: parseFloat(payload.amount) / 1_000_000,
            commandHistory: [],
            metrics: {
                totalCommands: 0,
                avgResponseTime: 0,
                successRate: 100,
                dataTransferred: 0,
                currentLatency: 0
            }
        };

        this.activeSessions.set(sessionId, session);
        return session;
    }

    private async establishDeviceConnection(device: IoTDeviceRegistry): Promise<any> {
        // Establish connection based on protocol
        switch (device.networkConfig.protocol) {
            case 'http':
                // HTTP connections are stateless, no persistent connection needed
                return { type: 'http', endpoint: device.networkConfig.endpoint };
            
            case 'websocket':
                // Establish WebSocket connection
                const wsUrl = `${device.networkConfig.ssl ? 'wss' : 'ws'}://${device.networkConfig.endpoint}:${device.networkConfig.port}`;
                const ws = new WebSocket(wsUrl);
                this.deviceConnections.set(device.deviceId, ws);
                return { type: 'websocket', connection: ws };
            
            case 'mqtt':
                // MQTT connection would require mqtt library
                console.warn('MQTT protocol not yet implemented');
                return { type: 'mqtt', endpoint: device.networkConfig.endpoint };
            
            case 'coap':
                // CoAP connection would require coap library
                console.warn('CoAP protocol not yet implemented');
                return { type: 'coap', endpoint: device.networkConfig.endpoint };
            
            default:
                throw new IoTDeviceError(`Unsupported protocol: ${device.networkConfig.protocol}`);
        }
    }

    private validateCommandForDevice(command: DeviceCommand, device: IoTDeviceRegistry): void {
        // Validate that the command is supported by the device
        const supportedCommands = device.capabilities.map(cap => cap.name);
        
        if (!supportedCommands.includes(command.type)) {
            throw new IoTDeviceError(
                `Command ${command.type} not supported by device ${device.deviceId}`,
                { supportedCommands }
            );
        }
    }

    private calculateCommandCost(
        device: IoTDeviceRegistry,
        command: DeviceCommand,
        executionTime: number
    ): number {
        const baseRate = device.pricing.baseRate;
        const commandRate = device.pricing.commandRates[command.type] || 0.001;
        const timeRate = (executionTime / 1000 / 60) * baseRate; // per minute
        
        return commandRate + timeRate;
    }

    private generateSessionId(deviceId: string): string {
        return `iot_session_${deviceId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    private generateExecutionId(): string {
        return `iot_exec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    private generateAuthToken(session: DeviceSession, device: IoTDeviceRegistry): string {
        const payload = {
            sessionId: session.sessionId,
            deviceId: device.deviceId,
            userId: session.userId,
            deviceType: device.deviceType,
            expiresAt: session.startTime + session.duration
        };
        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    /**
     * Get device registry
     */
    getDeviceRegistry(): IoTDeviceRegistry[] {
        return Array.from(this.deviceRegistry.values());
    }

    /**
     * Get device by ID
     */
    getDevice(deviceId: string): IoTDeviceRegistry | undefined {
        return this.deviceRegistry.get(deviceId);
    }

    /**
     * Get active sessions
     */
    getActiveSessions(): DeviceSession[] {
        return Array.from(this.activeSessions.values());
    }

    /**
     * Terminate device session
     */
    async terminateSession(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        // Close any active connections
        const connection = this.deviceConnections.get(session.deviceId);
        if (connection && connection.close) {
            connection.close();
            this.deviceConnections.delete(session.deviceId);
        }

        // Update session status
        session.status = 'completed';
        this.activeSessions.delete(sessionId);
    }
}