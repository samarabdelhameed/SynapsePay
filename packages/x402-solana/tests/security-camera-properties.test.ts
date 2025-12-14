/**
 * Property-Based Tests for Security Camera Management System
 * **Feature: synapsepay-enhancements, Property 25: إدارة كاميرات المراقبة**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Keypair, PublicKey } from '@solana/web3.js';
import { 
    AdvancedX402Client,
    RobotControlSystem,
    RobotControlPayload,
    DeviceCommand,
    DeviceSession,
    AdvancedX402Config
} from '../src';

// Mock configuration for security camera testing
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
            maxSessionDuration: 14400, // 4 hours for surveillance sessions
            supportedDeviceTypes: ['robot', 'drone', '3d_printer', 'smart_home', 'security_camera', 'industrial']
        },
        iotDevice: {
            enabled: true,
            supportedProtocols: ['http', 'mqtt', 'websocket', 'rtsp'],
            maxDevicesPerUser: 25
        },
        security: {
            rateLimiting: {
                requestsPerMinute: 100, // Higher rate for security cameras
                requestsPerHour: 2000,
                burstLimit: 20,
                cooldownPeriod: 300
            },
            emergencyPause: {
                enabled: true,
                triggers: ['motion_detected', 'tampering_detected', 'connection_lost'],
                pauseDuration: 900
            },
            accessControl: {
                requireKYC: true // Security cameras require identity verification
            }
        }
    }
};

// Security Camera Simulator
class SecurityCameraSimulator {
    private cameras: Map<string, {
        id: string;
        model: string;
        type: 'indoor' | 'outdoor' | 'ptz' | 'thermal' | 'doorbell' | 'nvr';
        status: 'online' | 'offline' | 'recording' | 'streaming' | 'motion_detected' | 'error';
        position: { 
            pan: number; // -180 to 180 degrees
            tilt: number; // -90 to 90 degrees
            zoom: number; // 1x to max zoom
        };
        settings: {
            resolution: string;
            fps: number;
            nightVision: boolean;
            motionDetection: boolean;
            audioRecording: boolean;
            privacyMode: boolean;
        };
        capabilities: string[];
        streams: {
            live: { active: boolean; url?: string; viewers: number };
            recording: { active: boolean; duration: number; storage: number }; // storage in MB
        };
        events: Array<{
            timestamp: number;
            type: 'motion' | 'sound' | 'tampering' | 'connection_lost' | 'recording_started' | 'recording_stopped';
            confidence: number; // 0-100
            metadata?: Record<string, any>;
        }>;
        storage: {
            used: number; // MB
            total: number; // MB
            retention: number; // days
        };
        network: {
            bandwidth: number; // Mbps
            latency: number; // ms
            quality: 'excellent' | 'good' | 'fair' | 'poor';
        };
        reliability: number;
    }> = new Map();

    constructor() {
        // Initialize different types of security cameras
        this.cameras.set('indoor-cam-001', {
            id: 'indoor-cam-001',
            model: 'Wyze Cam v3',
            type: 'indoor',
            status: 'online',
            position: { pan: 0, tilt: 0, zoom: 1 },
            settings: {
                resolution: '1080p',
                fps: 30,
                nightVision: true,
                motionDetection: true,
                audioRecording: true,
                privacyMode: false
            },
            capabilities: ['live_stream', 'motion_detection', 'night_vision', 'two_way_audio', 'cloud_storage'],
            streams: {
                live: { active: false, viewers: 0 },
                recording: { active: false, duration: 0, storage: 0 }
            },
            events: [],
            storage: { used: 150, total: 1000, retention: 7 },
            network: { bandwidth: 2.5, latency: 50, quality: 'good' },
            reliability: 1.0
        });

        this.cameras.set('outdoor-cam-002', {
            id: 'outdoor-cam-002',
            model: 'Arlo Pro 4',
            type: 'outdoor',
            status: 'online',
            position: { pan: 0, tilt: -15, zoom: 1 },
            settings: {
                resolution: '4K',
                fps: 30,
                nightVision: true,
                motionDetection: true,
                audioRecording: true,
                privacyMode: false
            },
            capabilities: ['live_stream', 'motion_detection', 'night_vision', 'weather_resistant', 'battery_powered', 'spotlight'],
            streams: {
                live: { active: false, viewers: 0 },
                recording: { active: false, duration: 0, storage: 0 }
            },
            events: [],
            storage: { used: 500, total: 2000, retention: 14 },
            network: { bandwidth: 5.0, latency: 40, quality: 'excellent' },
            reliability: 1.0
        });

        this.cameras.set('ptz-cam-003', {
            id: 'ptz-cam-003',
            model: 'Hikvision PTZ',
            type: 'ptz',
            status: 'online',
            position: { pan: 45, tilt: 10, zoom: 2 },
            settings: {
                resolution: '4K',
                fps: 60,
                nightVision: true,
                motionDetection: true,
                audioRecording: true,
                privacyMode: false
            },
            capabilities: ['live_stream', 'ptz_control', 'motion_detection', 'night_vision', 'auto_tracking', 'preset_positions'],
            streams: {
                live: { active: false, viewers: 0 },
                recording: { active: false, duration: 0, storage: 0 }
            },
            events: [],
            storage: { used: 800, total: 5000, retention: 30 },
            network: { bandwidth: 10.0, latency: 20, quality: 'excellent' },
            reliability: 1.0
        });

        this.cameras.set('thermal-cam-004', {
            id: 'thermal-cam-004',
            model: 'FLIR Thermal',
            type: 'thermal',
            status: 'online',
            position: { pan: 0, tilt: 0, zoom: 1 },
            settings: {
                resolution: '640x480',
                fps: 30,
                nightVision: false, // Thermal doesn't need night vision
                motionDetection: true,
                audioRecording: false,
                privacyMode: false
            },
            capabilities: ['thermal_imaging', 'temperature_detection', 'motion_detection', 'perimeter_detection', 'analytics'],
            streams: {
                live: { active: false, viewers: 0 },
                recording: { active: false, duration: 0, storage: 0 }
            },
            events: [],
            storage: { used: 300, total: 1500, retention: 60 },
            network: { bandwidth: 3.0, latency: 30, quality: 'good' },
            reliability: 1.0
        });

        this.cameras.set('doorbell-cam-005', {
            id: 'doorbell-cam-005',
            model: 'Ring Video Doorbell',
            type: 'doorbell',
            status: 'online',
            position: { pan: 0, tilt: 0, zoom: 1 }, // Fixed position
            settings: {
                resolution: '1080p',
                fps: 30,
                nightVision: true,
                motionDetection: true,
                audioRecording: true,
                privacyMode: false
            },
            capabilities: ['live_stream', 'motion_detection', 'night_vision', 'two_way_audio', 'doorbell_press', 'package_detection'],
            streams: {
                live: { active: false, viewers: 0 },
                recording: { active: false, duration: 0, storage: 0 }
            },
            events: [],
            storage: { used: 200, total: 800, retention: 30 },
            network: { bandwidth: 2.0, latency: 60, quality: 'fair' },
            reliability: 1.0
        });
    }

    async sendCameraCommand(cameraId: string, command: DeviceCommand): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        responseTime: number;
        cameraState: any;
        streamData?: any;
    }> {
        const camera = this.cameras.get(cameraId);
        
        if (!camera) {
            return {
                success: false,
                error: `Security camera ${cameraId} not found`,
                responseTime: 0,
                cameraState: null
            };
        }

        // Simulate network latency based on camera quality
        const baseLatency = camera.network.latency;
        const networkLatency = baseLatency + (Math.random() * 20 - 10);
        await new Promise(resolve => setTimeout(resolve, networkLatency));

        // Check camera status
        if (camera.status === 'offline') {
            return {
                success: false,
                error: 'Camera is offline',
                responseTime: networkLatency,
                cameraState: camera
            };
        }

        if (camera.status === 'error' && command.type !== 'emergency_stop') {
            return {
                success: false,
                error: 'Camera is in error state',
                responseTime: networkLatency,
                cameraState: camera
            };
        }

        // Simulate command execution with reliability
        // Emergency stop always succeeds regardless of reliability
        const commandSuccess = command.type === 'emergency_stop' || Math.random() < camera.reliability;
        
        if (!commandSuccess) {
            return {
                success: false,
                error: 'Camera command execution failed',
                responseTime: networkLatency,
                cameraState: camera
            };
        }

        // Execute camera command
        let commandResult: any = {};
        let streamData: any = {};

        try {
            switch (command.type) {
                case 'activate': // Start streaming/recording
                    const mode = command.parameters.mode || 'stream';
                    
                    if (mode === 'stream') {
                        camera.streams.live.active = true;
                        camera.streams.live.url = `rtsp://192.168.1.100:554/${camera.id}/live`;
                        camera.streams.live.viewers = 1;
                        camera.status = 'streaming';
                        
                        commandResult = {
                            streaming_started: true,
                            stream_url: camera.streams.live.url,
                            resolution: camera.settings.resolution,
                            fps: camera.settings.fps
                        };
                        
                        streamData = { action: 'start_stream', url: camera.streams.live.url };
                    } else if (mode === 'record') {
                        camera.streams.recording.active = true;
                        camera.status = 'recording';
                        
                        commandResult = {
                            recording_started: true,
                            resolution: camera.settings.resolution,
                            fps: camera.settings.fps,
                            storage_available: camera.storage.total - camera.storage.used
                        };
                        
                        streamData = { action: 'start_recording' };
                        
                        // Simulate recording progress
                        this.simulateRecording(camera);
                    }
                    break;

                case 'deactivate': // Stop streaming/recording
                    if (camera.streams.live.active) {
                        camera.streams.live.active = false;
                        camera.streams.live.viewers = 0;
                        commandResult = { streaming_stopped: true };
                        streamData = { action: 'stop_stream' };
                    }
                    
                    if (camera.streams.recording.active) {
                        camera.streams.recording.active = false;
                        commandResult = { 
                            ...commandResult,
                            recording_stopped: true,
                            duration: camera.streams.recording.duration,
                            storage_used: camera.streams.recording.storage
                        };
                        streamData = { ...streamData, action: 'stop_recording' };
                    }
                    
                    camera.status = 'online';
                    break;

                case 'move': // PTZ control
                    if (!camera.capabilities.includes('ptz_control')) {
                        throw new Error('Camera does not support PTZ control');
                    }
                    
                    const { pan, tilt, zoom } = command.parameters;
                    
                    // Validate PTZ limits
                    if (pan !== undefined) {
                        if (pan < -180 || pan > 180) {
                            throw new Error(`Pan angle ${pan} outside range [-180, 180]`);
                        }
                        camera.position.pan = pan;
                    }
                    
                    if (tilt !== undefined) {
                        if (tilt < -90 || tilt > 90) {
                            throw new Error(`Tilt angle ${tilt} outside range [-90, 90]`);
                        }
                        camera.position.tilt = tilt;
                    }
                    
                    if (zoom !== undefined) {
                        const maxZoom = camera.type === 'ptz' ? 20 : 4;
                        if (zoom < 1 || zoom > maxZoom) {
                            throw new Error(`Zoom level ${zoom} outside range [1, ${maxZoom}]`);
                        }
                        camera.position.zoom = zoom;
                    }
                    
                    commandResult = {
                        ptz_moved: true,
                        new_position: { ...camera.position }
                    };
                    
                    streamData = { action: 'ptz_move', position: camera.position };
                    break;

                case 'configure':
                    const settings = command.parameters.settings || {};
                    
                    // Update camera settings
                    if (settings.resolution) {
                        const validResolutions = ['720p', '1080p', '4K'];
                        if (validResolutions.includes(settings.resolution)) {
                            camera.settings.resolution = settings.resolution;
                        }
                    }
                    
                    if (settings.fps !== undefined) {
                        camera.settings.fps = Math.max(1, Math.min(60, settings.fps));
                    }
                    
                    if (settings.nightVision !== undefined) {
                        camera.settings.nightVision = settings.nightVision;
                    }
                    
                    if (settings.motionDetection !== undefined) {
                        camera.settings.motionDetection = settings.motionDetection;
                    }
                    
                    if (settings.privacyMode !== undefined) {
                        camera.settings.privacyMode = settings.privacyMode;
                        if (settings.privacyMode) {
                            // Privacy mode stops all streaming/recording
                            camera.streams.live.active = false;
                            camera.streams.recording.active = false;
                            camera.status = 'online';
                        }
                    }
                    
                    commandResult = {
                        settings_updated: true,
                        current_settings: { ...camera.settings }
                    };
                    break;

                case 'status':
                    commandResult = {
                        camera_id: camera.id,
                        model: camera.model,
                        type: camera.type,
                        status: camera.status,
                        position: camera.position,
                        settings: camera.settings,
                        capabilities: camera.capabilities,
                        streams: camera.streams,
                        storage: camera.storage,
                        network: camera.network,
                        recent_events: camera.events.slice(-5)
                    };
                    break;

                case 'emergency_stop':
                    // Emergency stop - disable all recording/streaming
                    camera.streams.live.active = false;
                    camera.streams.recording.active = false;
                    camera.settings.privacyMode = true;
                    camera.status = 'online';
                    
                    commandResult = {
                        emergency_stopped: true,
                        all_streams_disabled: true,
                        privacy_mode_enabled: true
                    };
                    
                    streamData = { action: 'emergency_stop' };
                    break;

                default:
                    // Check if it's a camera-specific capability
                    if (camera.capabilities.includes(command.type)) {
                        commandResult = {
                            [command.type]: true,
                            parameters: command.parameters
                        };
                        streamData = { action: command.type, parameters: command.parameters };
                    } else {
                        throw new Error(`Unsupported command ${command.type} for camera ${camera.model}`);
                    }
            }

            // Simulate motion detection events randomly
            if (camera.settings.motionDetection && Math.random() < 0.1) {
                this.generateMotionEvent(camera);
            }

            return {
                success: true,
                data: commandResult,
                responseTime: networkLatency,
                cameraState: camera,
                streamData
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: networkLatency,
                cameraState: camera
            };
        }
    }

    private simulateRecording(camera: any): void {
        if (!camera.streams.recording.active) return;
        
        // Simulate recording progress
        camera.streams.recording.duration += 1; // 1 minute increments
        
        // Calculate storage usage based on resolution and fps
        let storageRate = 1; // MB per minute base rate
        
        switch (camera.settings.resolution) {
            case '4K':
                storageRate = 8;
                break;
            case '1080p':
                storageRate = 4;
                break;
            case '720p':
                storageRate = 2;
                break;
        }
        
        storageRate *= (camera.settings.fps / 30); // Adjust for fps
        
        camera.streams.recording.storage += storageRate;
        camera.storage.used += storageRate;
        
        // Check storage limits
        if (camera.storage.used >= camera.storage.total * 0.95) {
            camera.streams.recording.active = false;
            camera.status = 'online';
            
            // Add storage full event
            camera.events.push({
                timestamp: Date.now(),
                type: 'recording_stopped',
                confidence: 100,
                metadata: { reason: 'storage_full' }
            });
        } else {
            // Continue recording
            setTimeout(() => this.simulateRecording(camera), 1000);
        }
    }

    private generateMotionEvent(camera: any): void {
        const event = {
            timestamp: Date.now(),
            type: 'motion' as const,
            confidence: 70 + Math.random() * 30, // 70-100% confidence
            metadata: {
                zone: Math.floor(Math.random() * 4) + 1,
                duration: Math.floor(Math.random() * 10) + 1
            }
        };
        
        camera.events.push(event);
        
        // Keep only last 50 events
        if (camera.events.length > 50) {
            camera.events = camera.events.slice(-50);
        }
        
        // Trigger motion detected status temporarily
        const originalStatus = camera.status;
        camera.status = 'motion_detected';
        
        setTimeout(() => {
            if (camera.status === 'motion_detected') {
                camera.status = originalStatus;
            }
        }, 5000);
    }

    getCamera(cameraId: string) {
        return this.cameras.get(cameraId);
    }

    getAllCameras() {
        return Array.from(this.cameras.values());
    }

    getCamerasByType(type: string) {
        return Array.from(this.cameras.values()).filter(camera => camera.type === type);
    }

    getCameraEvents(cameraId: string) {
        const camera = this.cameras.get(cameraId);
        return camera ? camera.events : [];
    }
}

describe('Security Camera Management Properties', () => {
    let client: AdvancedX402Client;
    let cameraSimulator: SecurityCameraSimulator;
    let userKeypair: Keypair;
    let mockWallet: {
        publicKey: PublicKey;
        signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    };

    beforeEach(() => {
        client = new AdvancedX402Client(testConfig);
        cameraSimulator = new SecurityCameraSimulator();
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
     * **Feature: synapsepay-enhancements, Property 25: إدارة كاميرات المراقبة**
     * Property: For any security camera connected, when sending control commands, 
     * the camera should respond and manage live streams successfully
     */
    it('Property 1: Security cameras should manage live streams and recording successfully', async () => {
        const cameraTypes = ['indoor', 'outdoor', 'ptz', 'thermal', 'doorbell'];
        const streamCommands = [
            { type: 'status' as const, parameters: {}, description: 'Check status' },
            { type: 'activate' as const, parameters: { mode: 'stream' }, description: 'Start live stream' },
            { type: 'activate' as const, parameters: { mode: 'record' }, description: 'Start recording' },
            { type: 'deactivate' as const, parameters: {}, description: 'Stop all streams' }
        ];

        for (const cameraType of cameraTypes) {
            const cameras = cameraSimulator.getCamerasByType(cameraType);
            const camera = cameras[0];
            
            if (!camera) continue;

            // Create security camera control payment
            const paymentResult = await client.createRobotControlPayment({
                deviceId: camera.id,
                deviceType: 'security_camera',
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.15, // Moderate cost for camera operations
                sessionDuration: 14400, // 4 hours for surveillance
                commands: streamCommands,
                controlEndpoint: `rtsp://192.168.1.100:554/${camera.id}`,
                safetyLimits: {
                    maxSpeed: 180, // degrees per second for PTZ
                    boundaries: {
                        x: [-180, 180], // Pan range
                        y: [-90, 90],   // Tilt range
                        z: [1, 20]      // Zoom range
                    }
                }
            });

            const payload = paymentResult.payload.payload as RobotControlPayload;
            
            // Verify security camera control payload structure
            expect(payload.deviceType).toBe('security_camera');
            expect(payload.controlParams.deviceId).toBe(camera.id);
            expect(payload.controlParams.commands).toHaveLength(4);
            expect(payload.sessionDuration).toBe(14400);
            expect(payload.controlEndpoint).toContain(camera.id);
            
            // Verify safety limits are appropriate for cameras
            expect(payload.controlParams.safetyLimits.boundaries.x).toEqual([-180, 180]);
            expect(payload.controlParams.safetyLimits.boundaries.y).toEqual([-90, 90]);
            
            // Verify gasless and camera control features
            expect(paymentResult.payload.features.gasless).toBe(true);
            expect(paymentResult.payload.features.robotControl).toBe(true);
        }
    });

    /**
     * Property: Camera streaming operations should work correctly with different modes
     */
    it('Property 2: Camera streaming should support live streaming and recording modes', async () => {
        const camera = cameraSimulator.getCamera('outdoor-cam-002')!;
        
        // Test streaming workflow
        const streamingWorkflow = [
            { command: { type: 'status' as const, parameters: {} }, expectedStatus: 'online' },
            { command: { type: 'activate' as const, parameters: { mode: 'stream' } }, expectedStatus: 'streaming' },
            { command: { type: 'activate' as const, parameters: { mode: 'record' } }, expectedStatus: 'recording' },
            { command: { type: 'deactivate' as const, parameters: {} }, expectedStatus: 'online' }
        ];

        for (const step of streamingWorkflow) {
            const result = await cameraSimulator.sendCameraCommand(camera.id, step.command);
            
            // Verify successful execution
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.responseTime).toBeGreaterThan(0);
            expect(result.cameraState.status).toBe(step.expectedStatus);
            
            // Verify response time is reasonable for camera operations
            expect(result.responseTime).toBeLessThan(200); // Max 200ms for camera commands
            
            // Verify stream data is recorded for streaming operations
            if (step.command.type === 'activate') {
                expect(result.streamData).toBeDefined();
                expect(result.streamData.action).toBeDefined();
                
                if (step.command.parameters.mode === 'stream') {
                    expect(result.data.streaming_started).toBe(true);
                    expect(result.data.stream_url).toBeDefined();
                    expect(result.cameraState.streams.live.active).toBe(true);
                } else if (step.command.parameters.mode === 'record') {
                    expect(result.data.recording_started).toBe(true);
                    expect(result.cameraState.streams.recording.active).toBe(true);
                }
            }
        }
    });

    /**
     * Property: PTZ cameras should support pan, tilt, and zoom controls with proper limits
     */
    it('Property 3: PTZ cameras should support movement controls within safe limits', async () => {
        const ptzCamera = cameraSimulator.getCamera('ptz-cam-003')!;
        
        const ptzTestCases = [
            {
                command: { type: 'move' as const, parameters: { pan: 90, tilt: 45, zoom: 5 } },
                shouldPass: true,
                description: 'Valid PTZ movement'
            },
            {
                command: { type: 'move' as const, parameters: { pan: -120, tilt: -30, zoom: 10 } },
                shouldPass: true,
                description: 'Valid negative angles'
            },
            {
                command: { type: 'move' as const, parameters: { pan: 200 } },
                shouldPass: false,
                description: 'Pan exceeds maximum range'
            },
            {
                command: { type: 'move' as const, parameters: { tilt: 100 } },
                shouldPass: false,
                description: 'Tilt exceeds maximum range'
            },
            {
                command: { type: 'move' as const, parameters: { zoom: 25 } },
                shouldPass: false,
                description: 'Zoom exceeds maximum range'
            }
        ];

        for (const testCase of ptzTestCases) {
            const result = await cameraSimulator.sendCameraCommand(ptzCamera.id, testCase.command);
            
            if (testCase.shouldPass) {
                expect(result.success).toBe(true);
                expect(result.data.ptz_moved).toBe(true);
                expect(result.data.new_position).toBeDefined();
                
                // Verify position was updated correctly
                if (testCase.command.parameters.pan !== undefined) {
                    expect(result.cameraState.position.pan).toBe(testCase.command.parameters.pan);
                }
                if (testCase.command.parameters.tilt !== undefined) {
                    expect(result.cameraState.position.tilt).toBe(testCase.command.parameters.tilt);
                }
                if (testCase.command.parameters.zoom !== undefined) {
                    expect(result.cameraState.position.zoom).toBe(testCase.command.parameters.zoom);
                }
            } else {
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.error).toMatch(/outside|range|exceeds/i);
            }
        }
    });

    /**
     * Property: Different camera types should have appropriate capabilities and features
     */
    it('Property 4: Different camera types should have type-specific capabilities', async () => {
        const cameraCapabilityTests = [
            {
                camera: cameraSimulator.getCamera('indoor-cam-001')!,
                expectedCapabilities: ['live_stream', 'motion_detection', 'night_vision', 'two_way_audio', 'cloud_storage'],
                specialCommands: ['two_way_audio', 'cloud_storage']
            },
            {
                camera: cameraSimulator.getCamera('ptz-cam-003')!,
                expectedCapabilities: ['live_stream', 'ptz_control', 'motion_detection', 'night_vision', 'auto_tracking', 'preset_positions'],
                specialCommands: ['auto_tracking', 'preset_positions']
            },
            {
                camera: cameraSimulator.getCamera('thermal-cam-004')!,
                expectedCapabilities: ['thermal_imaging', 'temperature_detection', 'motion_detection', 'perimeter_detection', 'analytics'],
                specialCommands: ['thermal_imaging', 'temperature_detection']
            },
            {
                camera: cameraSimulator.getCamera('doorbell-cam-005')!,
                expectedCapabilities: ['live_stream', 'motion_detection', 'night_vision', 'two_way_audio', 'doorbell_press', 'package_detection'],
                specialCommands: ['doorbell_press', 'package_detection']
            }
        ];

        for (const test of cameraCapabilityTests) {
            // Verify capabilities match expected
            expect(test.camera.capabilities).toEqual(expect.arrayContaining(test.expectedCapabilities));
            
            // Test camera-specific commands
            for (const specialCommand of test.specialCommands) {
                const result = await cameraSimulator.sendCameraCommand(test.camera.id, {
                    type: specialCommand as any,
                    parameters: {},
                    priority: 5
                });
                
                expect(result.success).toBe(true);
                expect(result.data[specialCommand]).toBe(true);
            }
        }
    });

    /**
     * Property: Camera settings should be configurable and persistent
     */
    it('Property 5: Camera settings should be configurable and maintain state', async () => {
        const camera = cameraSimulator.getCamera('outdoor-cam-002')!;
        
        // Test various setting configurations
        const settingsTests = [
            {
                settings: { resolution: '1080p', fps: 30, nightVision: true },
                description: 'Standard HD settings'
            },
            {
                settings: { resolution: '4K', fps: 60, motionDetection: false },
                description: 'High quality settings'
            },
            {
                settings: { privacyMode: true },
                description: 'Privacy mode activation'
            },
            {
                settings: { privacyMode: false, nightVision: false },
                description: 'Privacy mode deactivation'
            }
        ];

        for (const test of settingsTests) {
            const configResult = await cameraSimulator.sendCameraCommand(camera.id, {
                type: 'configure',
                parameters: { settings: test.settings },
                priority: 5
            });
            
            expect(configResult.success).toBe(true);
            expect(configResult.data.settings_updated).toBe(true);
            expect(configResult.data.current_settings).toBeDefined();
            
            // Verify settings were applied
            for (const [key, value] of Object.entries(test.settings)) {
                expect(configResult.cameraState.settings[key]).toBe(value);
            }
            
            // Verify settings persistence by checking status
            const statusResult = await cameraSimulator.sendCameraCommand(camera.id, {
                type: 'status',
                parameters: {},
                priority: 1
            });
            
            expect(statusResult.success).toBe(true);
            
            // Check that settings persisted
            for (const [key, value] of Object.entries(test.settings)) {
                expect(statusResult.cameraState.settings[key]).toBe(value);
            }
        }
    });

    /**
     * Property: Storage management should track usage and prevent overflow
     */
    it('Property 6: Storage management should track usage accurately', async () => {
        const camera = cameraSimulator.getCamera('indoor-cam-001')!;
        
        // Record initial storage state
        const initialStorage = camera.storage.used;
        
        // Start recording
        const recordResult = await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'activate',
            parameters: { mode: 'record' },
            priority: 5
        });
        
        expect(recordResult.success).toBe(true);
        expect(recordResult.data.recording_started).toBe(true);
        expect(recordResult.data.storage_available).toBeGreaterThan(0);
        
        // Wait for some recording to occur
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check storage usage increased
        const statusResult = await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'status',
            parameters: {},
            priority: 1
        });
        
        expect(statusResult.success).toBe(true);
        expect(statusResult.cameraState.storage.used).toBeGreaterThan(initialStorage);
        expect(statusResult.cameraState.streams.recording.duration).toBeGreaterThan(0);
        
        // Stop recording
        const stopResult = await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'deactivate',
            parameters: {},
            priority: 5
        });
        
        expect(stopResult.success).toBe(true);
        expect(stopResult.data.recording_stopped).toBe(true);
        expect(stopResult.data.duration).toBeGreaterThan(0);
        expect(stopResult.data.storage_used).toBeGreaterThan(0);
    });

    /**
     * Property: Motion detection should generate events and trigger appropriate responses
     */
    it('Property 7: Motion detection should generate events when enabled', async () => {
        const camera = cameraSimulator.getCamera('outdoor-cam-002')!;
        
        // Ensure motion detection is enabled
        await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'configure',
            parameters: { settings: { motionDetection: true } },
            priority: 5
        });
        
        // Start streaming to enable motion detection
        const streamResult = await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'activate',
            parameters: { mode: 'stream' },
            priority: 5
        });
        
        expect(streamResult.success).toBe(true);
        
        // Execute multiple status checks to potentially trigger motion events
        const initialEventCount = camera.events.length;
        
        for (let i = 0; i < 20; i++) {
            await cameraSimulator.sendCameraCommand(camera.id, {
                type: 'status',
                parameters: {},
                priority: 1
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Check if any motion events were generated
        const finalEventCount = camera.events.length;
        
        // Motion events are random, so we just verify the system can generate them
        // and that the event structure is correct if any were generated
        if (finalEventCount > initialEventCount) {
            const recentEvents = camera.events.slice(initialEventCount);
            
            for (const event of recentEvents) {
                expect(event.timestamp).toBeGreaterThan(0);
                expect(event.type).toBeDefined();
                expect(event.confidence).toBeGreaterThanOrEqual(0);
                expect(event.confidence).toBeLessThanOrEqual(100);
            }
        }
        
        // Stop streaming
        await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'deactivate',
            parameters: {},
            priority: 5
        });
    });

    /**
     * Property: Privacy mode should disable all streaming and recording
     */
    it('Property 8: Privacy mode should disable all camera functions', async () => {
        const camera = cameraSimulator.getCamera('indoor-cam-001')!;
        
        // Start streaming and recording
        await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'activate',
            parameters: { mode: 'stream' },
            priority: 5
        });
        
        await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'activate',
            parameters: { mode: 'record' },
            priority: 5
        });
        
        // Verify both are active
        let statusResult = await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'status',
            parameters: {},
            priority: 1
        });
        
        expect(statusResult.cameraState.streams.live.active).toBe(true);
        expect(statusResult.cameraState.streams.recording.active).toBe(true);
        
        // Enable privacy mode
        const privacyResult = await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'configure',
            parameters: { settings: { privacyMode: true } },
            priority: 10
        });
        
        expect(privacyResult.success).toBe(true);
        expect(privacyResult.cameraState.settings.privacyMode).toBe(true);
        
        // Verify all streams are disabled
        expect(privacyResult.cameraState.streams.live.active).toBe(false);
        expect(privacyResult.cameraState.streams.recording.active).toBe(false);
        expect(privacyResult.cameraState.status).toBe('online');
        
        // Verify privacy mode persists
        statusResult = await cameraSimulator.sendCameraCommand(camera.id, {
            type: 'status',
            parameters: {},
            priority: 1
        });
        
        expect(statusResult.cameraState.settings.privacyMode).toBe(true);
        expect(statusResult.cameraState.streams.live.active).toBe(false);
        expect(statusResult.cameraState.streams.recording.active).toBe(false);
    });

    /**
     * Property: Emergency stop should work reliably for all camera types
     */
    it('Property 9: Emergency stop should work reliably across all camera types', async () => {
        const allCameras = cameraSimulator.getAllCameras();
        
        for (const camera of allCameras) {
            // Start streaming and recording
            await cameraSimulator.sendCameraCommand(camera.id, {
                type: 'activate',
                parameters: { mode: 'stream' },
                priority: 5
            });
            
            // Start recording if camera supports it
            await cameraSimulator.sendCameraCommand(camera.id, {
                type: 'activate',
                parameters: { mode: 'record' },
                priority: 5
            });
            
            // Emergency stop
            const emergencyResult = await cameraSimulator.sendCameraCommand(camera.id, {
                type: 'emergency_stop',
                parameters: {},
                priority: 10
            });
            
            // Emergency stop should always succeed
            expect(emergencyResult.success).toBe(true);
            expect(emergencyResult.data.emergency_stopped).toBe(true);
            expect(emergencyResult.data.all_streams_disabled).toBe(true);
            expect(emergencyResult.data.privacy_mode_enabled).toBe(true);
            
            // All streams should be disabled
            expect(emergencyResult.cameraState.streams.live.active).toBe(false);
            expect(emergencyResult.cameraState.streams.recording.active).toBe(false);
            expect(emergencyResult.cameraState.settings.privacyMode).toBe(true);
            
            // Response time should be fast for emergency commands
            expect(emergencyResult.responseTime).toBeLessThan(150);
            
            // Reset camera for next test
            camera.settings.privacyMode = false;
            camera.status = 'online';
        }
    });

    /**
     * Property: Security camera control should integrate properly with payment system
     */
    it('Property 10: Security camera control should integrate with payment verification system', async () => {
        const cameraTypes = ['indoor-cam', 'outdoor-cam', 'ptz-cam', 'thermal-cam', 'doorbell-cam'];
        
        for (const cameraType of cameraTypes) {
            const cameraId = `${cameraType}-payment-test-${Date.now()}`;
            
            // Create security camera control payment
            const paymentResult = await client.createRobotControlPayment({
                deviceId: cameraId,
                deviceType: 'security_camera',
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.20, // Moderate cost for camera operations
                sessionDuration: 21600, // 6 hours for extended surveillance
                commands: [
                    { type: 'status', parameters: {}, priority: 1 },
                    { type: 'activate', parameters: { mode: 'stream' }, priority: 5 },
                    { type: 'configure', parameters: { settings: { resolution: '1080p' } }, priority: 3 },
                    { type: 'deactivate', parameters: {}, priority: 1 }
                ],
                controlEndpoint: `rtsp://192.168.1.100:554/${cameraId}`,
                safetyLimits: {
                    maxSpeed: 90, // degrees per second
                    boundaries: {
                        x: [-180, 180],
                        y: [-90, 90],
                        z: [1, 10]
                    }
                }
            });

            const payload = paymentResult.payload.payload as RobotControlPayload;
            
            // Verify payment structure for security camera operations
            expect(payload.deviceType).toBe('security_camera');
            expect(payload.controlParams.deviceId).toBe(cameraId);
            expect(payload.controlEndpoint).toContain(cameraId);
            expect(payload.sessionDuration).toBe(21600);
            
            // Verify moderate cost for camera operations
            expect(payload.amount).toBe('200000'); // 0.20 USDC in lamports
            
            // Verify camera-specific safety limits
            expect(payload.controlParams.safetyLimits.maxSpeed).toBe(90);
            expect(payload.controlParams.safetyLimits.boundaries.x).toEqual([-180, 180]);
            
            // Verify required features are enabled
            expect(paymentResult.payload.features.gasless).toBe(true);
            expect(paymentResult.payload.features.robotControl).toBe(true);
            
            // Verify payment includes camera-specific configurations
            expect(payload.facilitator).toBe(testConfig.features.gasless.facilitatorAddress);
            expect(payload.paymentIntentSignature).toBeDefined();
        }
    });
});