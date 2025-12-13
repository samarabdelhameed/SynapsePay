/**
 * Robot Control System for X402 Protocol
 * Enables real-time control of physical devices through micropayments
 */

import { 
    RobotControlPayload, 
    RobotControlResult, 
    DeviceSession, 
    DeviceCommand, 
    ExecutedCommand,
    SessionMetrics,
    RobotControlError,
    SafetyLimits,
    QoSRequirements
} from './advanced-types';

export interface RobotControlConfig {
    /** Base URL for robot control API */
    baseUrl: string;
    /** WebSocket URL for real-time communication */
    websocketUrl?: string;
    /** Authentication configuration */
    auth?: {
        type: 'none' | 'token' | 'certificate';
        credentials?: Record<string, string>;
    };
    /** Safety configuration */
    safety: SafetyLimits;
    /** Quality of service requirements */
    qos: QoSRequirements;
}

export class RobotControlSystem {
    private activeSessions: Map<string, DeviceSession> = new Map();
    private deviceConnections: Map<string, WebSocket> = new Map();
    private config: RobotControlConfig;

    constructor(config: RobotControlConfig) {
        this.config = config;
    }

    /**
     * Initialize robot control session after payment verification
     */
    async initializeControlSession(
        payload: RobotControlPayload,
        paymentVerified: boolean
    ): Promise<RobotControlResult> {
        if (!paymentVerified) {
            throw new RobotControlError('Payment not verified for robot control');
        }

        try {
            // Validate device availability
            await this.validateDeviceAvailability(payload.controlParams.deviceId);

            // Create session
            const session = await this.createDeviceSession(payload);

            // Establish device connection
            const controlEndpoint = await this.establishDeviceConnection(session);

            // Setup WebSocket for real-time communication
            const websocketUrl = await this.setupRealtimeConnection(session);

            // Generate session token
            const sessionToken = this.generateSessionToken(session);

            return {
                session,
                controlEndpoint,
                websocketUrl,
                sessionToken
            };
        } catch (error) {
            throw new RobotControlError(
                `Failed to initialize robot control session: ${error}`,
                { payload }
            );
        }
    }

    /**
     * Validate that the device is available for control
     */
    private async validateDeviceAvailability(deviceId: string): Promise<void> {
        try {
            const response = await fetch(`${this.config.baseUrl}/devices/${deviceId}/status`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new RobotControlError(`Device ${deviceId} not found or unavailable`);
            }

            const deviceStatus = await response.json();
            
            if (deviceStatus.status !== 'online') {
                throw new RobotControlError(
                    `Device ${deviceId} is not online`,
                    { deviceStatus }
                );
            }

            if (deviceStatus.busy) {
                throw new RobotControlError(
                    `Device ${deviceId} is currently busy`,
                    { deviceStatus }
                );
            }
        } catch (error) {
            if (error instanceof RobotControlError) {
                throw error;
            }
            throw new RobotControlError(
                `Failed to validate device availability: ${error}`,
                { deviceId }
            );
        }
    }

    /**
     * Create a new device control session
     */
    private async createDeviceSession(payload: RobotControlPayload): Promise<DeviceSession> {
        const sessionId = this.generateSessionId(payload);
        const startTime = Math.floor(Date.now() / 1000);

        const session: DeviceSession = {
            sessionId,
            deviceId: payload.controlParams.deviceId,
            userId: payload.payer,
            startTime,
            duration: payload.sessionDuration,
            status: 'active',
            totalCost: parseFloat(payload.amount) / 1_000_000, // Convert from USDC lamports
            commandHistory: [],
            metrics: {
                totalCommands: 0,
                avgResponseTime: 0,
                successRate: 100,
                dataTransferred: 0,
                currentLatency: 0
            }
        };

        // Store session
        this.activeSessions.set(sessionId, session);

        // Set session timeout
        setTimeout(() => {
            this.terminateSession(sessionId, 'expired');
        }, payload.sessionDuration * 1000);

        return session;
    }

    /**
     * Establish connection to the physical device
     */
    private async establishDeviceConnection(session: DeviceSession): Promise<string> {
        try {
            const response = await fetch(`${this.config.baseUrl}/devices/${session.deviceId}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    userId: session.userId,
                    duration: session.duration,
                    safetyLimits: this.config.safety
                })
            });

            if (!response.ok) {
                throw new RobotControlError('Failed to establish device connection');
            }

            const connectionResult = await response.json();
            return connectionResult.controlEndpoint;
        } catch (error) {
            throw new RobotControlError(
                `Failed to establish device connection: ${error}`,
                { session }
            );
        }
    }

    /**
     * Setup real-time WebSocket connection for device control
     */
    private async setupRealtimeConnection(session: DeviceSession): Promise<string | undefined> {
        if (!this.config.websocketUrl) {
            return undefined;
        }

        try {
            const wsUrl = `${this.config.websocketUrl}/devices/${session.deviceId}/realtime?sessionId=${session.sessionId}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log(`WebSocket connected for session ${session.sessionId}`);
                this.deviceConnections.set(session.sessionId, ws);
            };

            ws.onmessage = (event: MessageEvent) => {
                this.handleRealtimeMessage(session.sessionId, JSON.parse(event.data));
            };

            ws.onclose = () => {
                console.log(`WebSocket disconnected for session ${session.sessionId}`);
                this.deviceConnections.delete(session.sessionId);
            };

            ws.onerror = (error: Event) => {
                console.error(`WebSocket error for session ${session.sessionId}:`, error);
            };

            return wsUrl;
        } catch (error) {
            console.warn(`Failed to setup WebSocket connection: ${error}`);
            return undefined;
        }
    }

    /**
     * Execute a command on the device
     */
    async executeCommand(
        sessionId: string,
        command: DeviceCommand
    ): Promise<ExecutedCommand> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new RobotControlError('Session not found or expired');
        }

        if (session.status !== 'active') {
            throw new RobotControlError('Session is not active');
        }

        try {
            // Validate command safety
            this.validateCommandSafety(command);

            // Execute command
            const startTime = Date.now();
            const result = await this.sendCommandToDevice(session.deviceId, command);
            const executionTime = Date.now() - startTime;

            // Create executed command record
            const executedCommand: ExecutedCommand = {
                ...command,
                executionId: this.generateExecutionId(),
                executedAt: Math.floor(startTime / 1000),
                result: {
                    success: result.success,
                    data: result.data,
                    error: result.error,
                    executionTime
                },
                cost: this.calculateCommandCost(command, executionTime)
            };

            // Update session
            session.commandHistory.push(executedCommand);
            session.totalCost += executedCommand.cost;
            this.updateSessionMetrics(session, executedCommand);

            return executedCommand;
        } catch (error) {
            throw new RobotControlError(
                `Failed to execute command: ${error}`,
                { sessionId, command }
            );
        }
    }

    /**
     * Validate command against safety limits
     */
    private validateCommandSafety(command: DeviceCommand): void {
        const safety = this.config.safety;

        // Check speed limits
        if (safety.maxSpeed && command.parameters.speed > safety.maxSpeed) {
            throw new RobotControlError(
                `Command speed ${command.parameters.speed} exceeds maximum ${safety.maxSpeed}`
            );
        }

        // Check force limits
        if (safety.maxForce && command.parameters.force > safety.maxForce) {
            throw new RobotControlError(
                `Command force ${command.parameters.force} exceeds maximum ${safety.maxForce}`
            );
        }

        // Check boundaries
        if (safety.boundaries) {
            const { x, y, z } = command.parameters;
            if (x !== undefined && safety.boundaries.x) {
                const [minX, maxX] = safety.boundaries.x;
                if (x < minX || x > maxX) {
                    throw new RobotControlError(`X coordinate ${x} outside boundaries [${minX}, ${maxX}]`);
                }
            }
            // Similar checks for y and z...
        }

        // Check emergency conditions
        if (safety.emergencyConditions) {
            for (const condition of safety.emergencyConditions) {
                if (this.checkEmergencyCondition(condition, command)) {
                    throw new RobotControlError(`Emergency condition triggered: ${condition}`);
                }
            }
        }
    }

    /**
     * Send command to physical device
     */
    private async sendCommandToDevice(
        deviceId: string,
        command: DeviceCommand
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const response = await fetch(`${this.config.baseUrl}/devices/${deviceId}/command`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(command)
            });

            const result = await response.json();
            
            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Command execution failed'
                };
            }

            return {
                success: true,
                data: result.data
            };
        } catch (error) {
            return {
                success: false,
                error: error?.toString()
            };
        }
    }

    /**
     * Handle real-time messages from device
     */
    private handleRealtimeMessage(sessionId: string, message: any): void {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        // Update session metrics based on message type
        switch (message.type) {
            case 'status_update':
                this.updateDeviceStatus(session, message.data);
                break;
            case 'telemetry':
                this.updateTelemetry(session, message.data);
                break;
            case 'error':
                this.handleDeviceError(session, message.data);
                break;
            case 'emergency':
                this.handleEmergency(session, message.data);
                break;
        }
    }

    /**
     * Update session metrics
     */
    private updateSessionMetrics(session: DeviceSession, command: ExecutedCommand): void {
        if (!session.metrics) return;

        session.metrics.totalCommands++;
        
        // Update average response time
        const totalTime = session.metrics.avgResponseTime * (session.metrics.totalCommands - 1);
        session.metrics.avgResponseTime = (totalTime + command.result.executionTime) / session.metrics.totalCommands;
        
        // Update success rate
        const successfulCommands = session.commandHistory.filter(cmd => cmd.result.success).length;
        session.metrics.successRate = (successfulCommands / session.metrics.totalCommands) * 100;
        
        // Update data transferred (estimate)
        session.metrics.dataTransferred += JSON.stringify(command).length;
    }

    /**
     * Terminate a session
     */
    async terminateSession(sessionId: string, reason: 'completed' | 'expired' | 'terminated'): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        try {
            // Update session status
            session.status = reason;

            // Close WebSocket connection
            const ws = this.deviceConnections.get(sessionId);
            if (ws) {
                ws.close();
                this.deviceConnections.delete(sessionId);
            }

            // Notify device to release control
            await fetch(`${this.config.baseUrl}/devices/${session.deviceId}/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    sessionId,
                    reason
                })
            });

            // Remove from active sessions
            this.activeSessions.delete(sessionId);
        } catch (error) {
            console.error(`Failed to terminate session ${sessionId}:`, error);
        }
    }

    /**
     * Get session information
     */
    getSession(sessionId: string): DeviceSession | undefined {
        return this.activeSessions.get(sessionId);
    }

    /**
     * Get all active sessions
     */
    getActiveSessions(): DeviceSession[] {
        return Array.from(this.activeSessions.values());
    }

    /**
     * Emergency stop for a session
     */
    async emergencyStop(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        try {
            // Send emergency stop command
            await this.sendCommandToDevice(session.deviceId, {
                type: 'emergency_stop',
                parameters: {},
                priority: 10
            });

            // Terminate session immediately
            await this.terminateSession(sessionId, 'terminated');
        } catch (error) {
            console.error(`Emergency stop failed for session ${sessionId}:`, error);
        }
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    private generateSessionId(payload: RobotControlPayload): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        return `session_${payload.controlParams.deviceId}_${timestamp}_${random}`;
    }

    private generateExecutionId(): string {
        return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    private generateSessionToken(session: DeviceSession): string {
        // In production, use proper JWT or similar
        const payload = {
            sessionId: session.sessionId,
            deviceId: session.deviceId,
            userId: session.userId,
            expiresAt: session.startTime + session.duration
        };
        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};
        
        if (this.config.auth?.type === 'token' && this.config.auth.credentials?.token) {
            headers['Authorization'] = `Bearer ${this.config.auth.credentials.token}`;
        }
        
        return headers;
    }

    private calculateCommandCost(command: DeviceCommand, executionTime: number): number {
        // Base cost calculation - can be customized per device type
        const baseCost = 0.001; // 0.001 USDC per command
        const timeCost = (executionTime / 1000) * 0.0001; // 0.0001 USDC per second
        const priorityCost = (command.priority || 1) * 0.0001; // Priority multiplier
        
        return baseCost + timeCost + priorityCost;
    }

    private checkEmergencyCondition(condition: string, command: DeviceCommand): boolean {
        // Implement emergency condition checks based on your safety requirements
        switch (condition) {
            case 'high_speed':
                return command.parameters.speed > 100;
            case 'dangerous_position':
                return command.parameters.x < 0 || command.parameters.y < 0;
            default:
                return false;
        }
    }

    private updateDeviceStatus(session: DeviceSession, statusData: any): void {
        // Update session with device status information
        if (session.metrics && statusData.latency) {
            session.metrics.currentLatency = statusData.latency;
        }
    }

    private updateTelemetry(session: DeviceSession, telemetryData: any): void {
        // Process telemetry data from device
        if (session.metrics && telemetryData.dataSize) {
            session.metrics.dataTransferred += telemetryData.dataSize;
        }
    }

    private handleDeviceError(session: DeviceSession, errorData: any): void {
        console.error(`Device error in session ${session.sessionId}:`, errorData);
        
        // If critical error, terminate session
        if (errorData.critical) {
            this.terminateSession(session.sessionId, 'terminated');
        }
    }

    private handleEmergency(session: DeviceSession, emergencyData: any): void {
        console.error(`Emergency in session ${session.sessionId}:`, emergencyData);
        
        // Always terminate session on emergency
        this.emergencyStop(session.sessionId);
    }
}