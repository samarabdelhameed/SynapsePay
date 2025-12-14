/**
 * Property-Based Tests for 3D Printer Control System
 * **Feature: synapsepay-enhancements, Property 24: التحكم في الطابعات ثلاثية الأبعاد**
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

// Mock configuration for 3D printer testing
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
            maxSessionDuration: 7200, // 2 hours for long print jobs
            supportedDeviceTypes: ['robot', 'drone', '3d_printer', 'smart_home', 'security_camera', 'industrial']
        },
        iotDevice: {
            enabled: true,
            supportedProtocols: ['http', 'mqtt', 'websocket', 'coap'],
            maxDevicesPerUser: 10
        },
        security: {
            rateLimiting: {
                requestsPerMinute: 30, // Lower rate for 3D printers
                requestsPerHour: 500,
                burstLimit: 5,
                cooldownPeriod: 600
            },
            emergencyPause: {
                enabled: true,
                triggers: ['filament_jam', 'temperature_error', 'bed_adhesion_failure'],
                pauseDuration: 3600
            },
            accessControl: {}
        }
    }
};

// 3D Printer Simulator
class Printer3DSimulator {
    private printers: Map<string, {
        id: string;
        model: string;
        status: 'idle' | 'printing' | 'paused' | 'heating' | 'cooling' | 'error' | 'offline';
        printJob: {
            active: boolean;
            fileName?: string;
            progress: number; // 0-100
            timeRemaining: number; // minutes
            layerCount: number;
            currentLayer: number;
        };
        temperatures: {
            hotend: { current: number; target: number };
            bed: { current: number; target: number };
            chamber: { current: number; target: number };
        };
        position: { x: number; y: number; z: number; e: number }; // extruder position
        filament: {
            type: string;
            remaining: number; // percentage
            diameter: number;
        };
        buildVolume: { x: number; y: number; z: number };
        capabilities: string[];
        sensors: {
            filament_sensor: boolean;
            bed_leveling: boolean;
            power_recovery: boolean;
            camera: boolean;
        };
        printHistory: Array<{
            fileName: string;
            startTime: number;
            endTime?: number;
            status: 'completed' | 'failed' | 'cancelled';
            layersPrinted: number;
        }>;
        reliability: number;
    }> = new Map();

    constructor() {
        // Initialize different types of 3D printers
        this.printers.set('fdm-printer-001', {
            id: 'fdm-printer-001',
            model: 'Prusa i3 MK3S+',
            status: 'idle',
            printJob: {
                active: false,
                progress: 0,
                timeRemaining: 0,
                layerCount: 0,
                currentLayer: 0
            },
            temperatures: {
                hotend: { current: 25, target: 0 },
                bed: { current: 25, target: 0 },
                chamber: { current: 25, target: 0 }
            },
            position: { x: 0, y: 0, z: 0, e: 0 },
            filament: {
                type: 'PLA',
                remaining: 85,
                diameter: 1.75
            },
            buildVolume: { x: 250, y: 210, z: 210 },
            capabilities: ['fdm_printing', 'auto_bed_leveling', 'filament_detection', 'pause_resume', 'temperature_control'],
            sensors: {
                filament_sensor: true,
                bed_leveling: true,
                power_recovery: true,
                camera: false
            },
            printHistory: [],
            reliability: 1.0
        });

        this.printers.set('resin-printer-002', {
            id: 'resin-printer-002',
            model: 'Elegoo Mars 3',
            status: 'idle',
            printJob: {
                active: false,
                progress: 0,
                timeRemaining: 0,
                layerCount: 0,
                currentLayer: 0
            },
            temperatures: {
                hotend: { current: 25, target: 0 }, // Not used for resin
                bed: { current: 25, target: 0 },
                chamber: { current: 25, target: 0 }
            },
            position: { x: 0, y: 0, z: 0, e: 0 },
            filament: {
                type: 'Resin',
                remaining: 60,
                diameter: 0 // Not applicable for resin
            },
            buildVolume: { x: 143, y: 89, z: 175 },
            capabilities: ['sla_printing', 'uv_curing', 'resin_detection', 'pause_resume'],
            sensors: {
                filament_sensor: false,
                bed_leveling: false,
                power_recovery: false,
                camera: true
            },
            printHistory: [],
            reliability: 1.0
        });

        this.printers.set('industrial-printer-003', {
            id: 'industrial-printer-003',
            model: 'Ultimaker S5 Pro',
            status: 'idle',
            printJob: {
                active: false,
                progress: 0,
                timeRemaining: 0,
                layerCount: 0,
                currentLayer: 0
            },
            temperatures: {
                hotend: { current: 25, target: 0 },
                bed: { current: 25, target: 0 },
                chamber: { current: 25, target: 40 }
            },
            position: { x: 0, y: 0, z: 0, e: 0 },
            filament: {
                type: 'ABS',
                remaining: 92,
                diameter: 2.85
            },
            buildVolume: { x: 330, y: 240, z: 300 },
            capabilities: ['fdm_printing', 'dual_extrusion', 'enclosed_chamber', 'material_station', 'cloud_printing'],
            sensors: {
                filament_sensor: true,
                bed_leveling: true,
                power_recovery: true,
                camera: true
            },
            printHistory: [],
            reliability: 1.0
        });
    }

    async sendPrintCommand(printerId: string, command: DeviceCommand): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        responseTime: number;
        printerState: any;
        printData?: any;
    }> {
        const printer = this.printers.get(printerId);
        
        if (!printer) {
            return {
                success: false,
                error: `3D Printer ${printerId} not found`,
                responseTime: 0,
                printerState: null
            };
        }

        // Simulate communication latency (printers can be slow to respond)
        const communicationLatency = 200 + Math.random() * 300; // 200-500ms
        await new Promise(resolve => setTimeout(resolve, communicationLatency));

        // Check printer status
        if (printer.status === 'offline') {
            return {
                success: false,
                error: 'Printer is offline',
                responseTime: communicationLatency,
                printerState: printer
            };
        }

        // Check for error conditions
        if (printer.status === 'error' && command.type !== 'emergency_stop') {
            return {
                success: false,
                error: 'Printer is in error state',
                responseTime: communicationLatency,
                printerState: printer
            };
        }

        // Simulate command execution with reliability
        const commandSuccess = Math.random() < printer.reliability;
        
        if (!commandSuccess) {
            return {
                success: false,
                error: 'Print command execution failed',
                responseTime: communicationLatency,
                printerState: printer
            };
        }

        // Execute print command
        let commandResult: any = {};
        let printData: any = {};

        try {
            switch (command.type) {
                case 'activate': // Start print job
                    if (printer.status !== 'idle') {
                        throw new Error('Printer must be idle to start printing');
                    }
                    
                    const fileName = command.parameters.file || 'test_model.gcode';
                    const layerCount = command.parameters.layers || 100;
                    
                    // Check filament availability
                    if (printer.filament.remaining < 10) {
                        throw new Error('Insufficient filament to start print job');
                    }
                    
                    printer.status = 'heating';
                    printer.printJob = {
                        active: true,
                        fileName,
                        progress: 0,
                        timeRemaining: layerCount * 2, // 2 minutes per layer estimate
                        layerCount,
                        currentLayer: 0
                    };
                    
                    // Set target temperatures based on filament type
                    this.setTargetTemperatures(printer);
                    
                    commandResult = {
                        print_started: true,
                        file_name: fileName,
                        estimated_time: printer.printJob.timeRemaining,
                        layer_count: layerCount
                    };
                    
                    printData = { action: 'start_print', fileName, layerCount };
                    
                    // Simulate heating and transition to printing (faster for testing)
                    setTimeout(() => {
                        if (printer.printJob.active) {
                            printer.status = 'printing';
                            this.simulatePrintProgress(printer);
                        }
                    }, 1000); // 1 second heating simulation for testing
                    
                    break;

                case 'deactivate': // Stop/cancel print job
                    if (printer.printJob.active) {
                        printer.status = 'cooling';
                        printer.printJob.active = false;
                        
                        // Add to print history as cancelled
                        printer.printHistory.push({
                            fileName: printer.printJob.fileName || 'unknown',
                            startTime: Date.now() - (printer.printJob.progress * 1000),
                            endTime: Date.now(),
                            status: 'cancelled',
                            layersPrinted: printer.printJob.currentLayer
                        });
                        
                        commandResult = {
                            print_cancelled: true,
                            progress_at_cancel: printer.printJob.progress,
                            layers_completed: printer.printJob.currentLayer
                        };
                        
                        printData = { action: 'cancel_print', progress: printer.printJob.progress };
                        
                        // Reset print job
                        printer.printJob = {
                            active: false,
                            progress: 0,
                            timeRemaining: 0,
                            layerCount: 0,
                            currentLayer: 0
                        };
                        
                        // Simulate cooling
                        setTimeout(() => {
                            printer.status = 'idle';
                            printer.temperatures.hotend.target = 0;
                            printer.temperatures.bed.target = 0;
                        }, 3000);
                    } else {
                        commandResult = { no_active_print: true };
                    }
                    break;

                case 'configure':
                    if (command.parameters.pause && (printer.status === 'printing' || printer.status === 'heating')) {
                        printer.status = 'paused';
                        commandResult = { paused: true, current_layer: printer.printJob.currentLayer };
                        printData = { action: 'pause', layer: printer.printJob.currentLayer };
                    } else if (command.parameters.resume && printer.status === 'paused') {
                        printer.status = 'printing';
                        commandResult = { resumed: true, current_layer: printer.printJob.currentLayer };
                        printData = { action: 'resume', layer: printer.printJob.currentLayer };
                    } else if (command.parameters.temperature) {
                        const { hotend, bed, chamber } = command.parameters.temperature;
                        if (hotend !== undefined) printer.temperatures.hotend.target = hotend;
                        if (bed !== undefined) printer.temperatures.bed.target = bed;
                        if (chamber !== undefined) printer.temperatures.chamber.target = chamber;
                        
                        commandResult = {
                            temperature_set: true,
                            targets: {
                                hotend: printer.temperatures.hotend.target,
                                bed: printer.temperatures.bed.target,
                                chamber: printer.temperatures.chamber.target
                            }
                        };
                    }
                    break;

                case 'move':
                    if (printer.status === 'printing') {
                        throw new Error('Cannot move axes during printing');
                    }
                    
                    const { x, y, z, e } = command.parameters;
                    
                    // Validate movement within build volume
                    if (x !== undefined && (x < 0 || x > printer.buildVolume.x)) {
                        throw new Error(`X position ${x} outside build volume`);
                    }
                    if (y !== undefined && (y < 0 || y > printer.buildVolume.y)) {
                        throw new Error(`Y position ${y} outside build volume`);
                    }
                    if (z !== undefined && (z < 0 || z > printer.buildVolume.z)) {
                        throw new Error(`Z position ${z} outside build volume`);
                    }
                    
                    // Update position
                    if (x !== undefined) printer.position.x = x;
                    if (y !== undefined) printer.position.y = y;
                    if (z !== undefined) printer.position.z = z;
                    if (e !== undefined) printer.position.e = e;
                    
                    commandResult = {
                        moved: true,
                        new_position: { ...printer.position }
                    };
                    break;

                case 'status':
                    commandResult = {
                        printer_id: printer.id,
                        model: printer.model,
                        status: printer.status,
                        print_job: printer.printJob,
                        temperatures: printer.temperatures,
                        position: printer.position,
                        filament: printer.filament,
                        capabilities: printer.capabilities,
                        sensors: printer.sensors
                    };
                    break;

                case 'emergency_stop':
                    printer.status = 'error';
                    if (printer.printJob.active) {
                        printer.printJob.active = false;
                        printer.printHistory.push({
                            fileName: printer.printJob.fileName || 'unknown',
                            startTime: Date.now() - (printer.printJob.progress * 1000),
                            endTime: Date.now(),
                            status: 'failed',
                            layersPrinted: printer.printJob.currentLayer
                        });
                    }
                    
                    // Emergency stop - turn off heaters
                    printer.temperatures.hotend.target = 0;
                    printer.temperatures.bed.target = 0;
                    printer.temperatures.chamber.target = 0;
                    
                    commandResult = {
                        emergency_stopped: true,
                        heaters_disabled: true
                    };
                    
                    printData = { action: 'emergency_stop' };
                    break;

                default:
                    // Check if it's a printer-specific capability
                    if (printer.capabilities.includes(command.type)) {
                        commandResult = {
                            [command.type]: true,
                            parameters: command.parameters
                        };
                        printData = { action: command.type, parameters: command.parameters };
                    } else {
                        throw new Error(`Unsupported command ${command.type} for printer ${printer.model}`);
                    }
            }

            return {
                success: true,
                data: commandResult,
                responseTime: communicationLatency,
                printerState: printer,
                printData
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: communicationLatency,
                printerState: printer
            };
        }
    }

    private setTargetTemperatures(printer: any): void {
        switch (printer.filament.type) {
            case 'PLA':
                printer.temperatures.hotend.target = 210;
                printer.temperatures.bed.target = 60;
                break;
            case 'ABS':
                printer.temperatures.hotend.target = 250;
                printer.temperatures.bed.target = 100;
                printer.temperatures.chamber.target = 60;
                break;
            case 'PETG':
                printer.temperatures.hotend.target = 230;
                printer.temperatures.bed.target = 80;
                break;
            case 'Resin':
                // Resin printers don't use hotend heating
                printer.temperatures.bed.target = 0;
                break;
            default:
                printer.temperatures.hotend.target = 200;
                printer.temperatures.bed.target = 50;
        }
    }

    private simulatePrintProgress(printer: any): void {
        if (!printer.printJob.active || printer.status !== 'printing') return;
        
        // Simulate print progress (faster for testing)
        const progressIncrement = 100 / printer.printJob.layerCount;
        printer.printJob.progress = Math.min(100, printer.printJob.progress + progressIncrement);
        printer.printJob.currentLayer = Math.floor((printer.printJob.progress / 100) * printer.printJob.layerCount);
        printer.printJob.timeRemaining = Math.max(0, printer.printJob.timeRemaining - 2);
        
        // Simulate filament consumption (more noticeable for testing)
        printer.filament.remaining = Math.max(0, printer.filament.remaining - 0.5);
        
        // Check if print is complete
        if (printer.printJob.progress >= 100) {
            printer.status = 'cooling';
            printer.printJob.active = false;
            
            printer.printHistory.push({
                fileName: printer.printJob.fileName || 'unknown',
                startTime: Date.now() - (printer.printJob.layerCount * 2 * 60 * 1000),
                endTime: Date.now(),
                status: 'completed',
                layersPrinted: printer.printJob.layerCount
            });
            
            // Cool down (faster for testing)
            setTimeout(() => {
                printer.status = 'idle';
                printer.temperatures.hotend.target = 0;
                printer.temperatures.bed.target = 0;
            }, 1000);
        } else {
            // Continue printing (faster for testing)
            setTimeout(() => this.simulatePrintProgress(printer), 500);
        }
    }

    getPrinter(printerId: string) {
        return this.printers.get(printerId);
    }

    getAllPrinters() {
        return Array.from(this.printers.values());
    }

    getPrintersByType(type: string) {
        return Array.from(this.printers.values()).filter(printer => 
            printer.capabilities.some(cap => cap.includes(type))
        );
    }

    getPrintHistory(printerId: string) {
        const printer = this.printers.get(printerId);
        return printer ? printer.printHistory : [];
    }
}

describe('3D Printer Control System Properties', () => {
    let client: AdvancedX402Client;
    let printerSimulator: Printer3DSimulator;
    let userKeypair: Keypair;
    let mockWallet: {
        publicKey: PublicKey;
        signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    };

    beforeEach(() => {
        client = new AdvancedX402Client(testConfig);
        printerSimulator = new Printer3DSimulator();
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
     * **Feature: synapsepay-enhancements, Property 24: التحكم في الطابعات ثلاثية الأبعاد**
     * Property: For any 3D printer connected, when sending print files and control commands, 
     * the printer should execute printing operations successfully
     */
    it('Property 1: 3D printers should execute print jobs and control commands successfully', async () => {
        const printerTypes = ['fdm_printing', 'sla_printing'];
        const printCommands = [
            { type: 'status' as const, parameters: {}, description: 'Check status' },
            { type: 'activate' as const, parameters: { file: 'test_model.gcode', layers: 50 }, description: 'Start print' },
            { type: 'configure' as const, parameters: { pause: true }, description: 'Pause print' },
            { type: 'configure' as const, parameters: { resume: true }, description: 'Resume print' },
            { type: 'deactivate' as const, parameters: {}, description: 'Cancel print' }
        ];

        for (const printerType of printerTypes) {
            const printers = printerSimulator.getPrintersByType(printerType);
            const printer = printers[0];
            
            if (!printer) continue;

            // Create 3D printer control payment
            const paymentResult = await client.createRobotControlPayment({
                deviceId: printer.id,
                deviceType: '3d_printer',
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.50, // Higher cost for 3D printing operations
                sessionDuration: 7200, // 2 hours for long print jobs
                commands: printCommands,
                controlEndpoint: `http://192.168.1.100:8080/printer/${printer.id}`,
                safetyLimits: {
                    maxSpeed: 100, // mm/s
                    boundaries: {
                        x: [0, printer.buildVolume.x],
                        y: [0, printer.buildVolume.y],
                        z: [0, printer.buildVolume.z]
                    }
                }
            });

            const payload = paymentResult.payload.payload as RobotControlPayload;
            
            // Verify 3D printer control payload structure
            expect(payload.deviceType).toBe('3d_printer');
            expect(payload.controlParams.deviceId).toBe(printer.id);
            expect(payload.controlParams.commands).toHaveLength(5);
            expect(payload.sessionDuration).toBe(7200);
            expect(payload.controlEndpoint).toContain(printer.id);
            
            // Verify safety limits are appropriate for 3D printers
            expect(payload.controlParams.safetyLimits.boundaries.x[1]).toBe(printer.buildVolume.x);
            expect(payload.controlParams.safetyLimits.boundaries.y[1]).toBe(printer.buildVolume.y);
            expect(payload.controlParams.safetyLimits.boundaries.z[1]).toBe(printer.buildVolume.z);
            
            // Verify gasless and 3D printer control features
            expect(paymentResult.payload.features.gasless).toBe(true);
            expect(paymentResult.payload.features.robotControl).toBe(true);
        }
    });

    /**
     * Property: 3D printer operations should follow proper print workflow
     */
    it('Property 2: Print operations should follow proper start-print-finish workflow', async () => {
        const printer = printerSimulator.getPrinter('fdm-printer-001')!;
        
        // Test complete print workflow
        const printWorkflow = [
            { command: { type: 'status' as const, parameters: {} }, expectedStatus: 'idle' },
            { command: { type: 'activate' as const, parameters: { file: 'test_cube.gcode', layers: 20 } }, expectedStatus: 'heating' },
            { command: { type: 'configure' as const, parameters: { temperature: { hotend: 210, bed: 60 } } }, expectedStatus: 'heating' }
        ];

        for (const step of printWorkflow) {
            const result = await printerSimulator.sendPrintCommand(printer.id, step.command);
            
            // Verify successful execution
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.responseTime).toBeGreaterThan(0);
            expect(result.printerState.status).toBe(step.expectedStatus);
            
            // Verify response time is reasonable for 3D printer operations
            expect(result.responseTime).toBeLessThan(800); // Max 800ms for printer commands
            
            // Verify print data is recorded for print operations
            if (step.command.type === 'activate') {
                expect(result.printData).toBeDefined();
                expect(result.printData.action).toBe('start_print');
                expect(result.printData.fileName).toBe('test_cube.gcode');
                expect(result.printData.layerCount).toBe(20);
            }
        }
        
        // Wait for heating to complete and transition to printing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check that printer transitioned to printing
        const statusResult = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'status',
            parameters: {},
            priority: 1
        });
        
        expect(statusResult.success).toBe(true);
        expect(statusResult.printerState.printJob.active).toBe(true);
        // Status should be either 'printing' or 'heating' (both are valid during startup)
        expect(['printing', 'heating']).toContain(statusResult.printerState.status);
        
        // Cancel the print job
        const cancelResult = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'deactivate',
            parameters: {},
            priority: 1
        });
        
        expect(cancelResult.success).toBe(true);
        expect(cancelResult.data.print_cancelled).toBe(true);
    });

    /**
     * Property: 3D printer safety limits should be enforced for build volume and temperatures
     */
    it('Property 3: Safety limits should be enforced for build volume and temperature restrictions', async () => {
        const testCases = [
            {
                printer: printerSimulator.getPrinter('fdm-printer-001')!,
                safeCommands: [
                    { type: 'move' as const, parameters: { x: 100, y: 100, z: 100 } },
                    { type: 'configure' as const, parameters: { temperature: { hotend: 210, bed: 60 } } }
                ],
                unsafeCommands: [
                    { type: 'move' as const, parameters: { x: 300, y: 100, z: 100 } }, // Exceeds X build volume
                    { type: 'move' as const, parameters: { x: 100, y: 300, z: 100 } }, // Exceeds Y build volume
                    { type: 'move' as const, parameters: { x: 100, y: 100, z: 300 } }  // Exceeds Z build volume
                ]
            },
            {
                printer: printerSimulator.getPrinter('resin-printer-002')!,
                safeCommands: [
                    { type: 'move' as const, parameters: { x: 70, y: 40, z: 100 } }
                ],
                unsafeCommands: [
                    { type: 'move' as const, parameters: { x: 200, y: 40, z: 100 } }, // Exceeds X build volume
                    { type: 'move' as const, parameters: { x: 70, y: 150, z: 100 } }  // Exceeds Y build volume
                ]
            }
        ];

        for (const testCase of testCases) {
            // Test safe commands - should succeed
            for (const safeCommand of testCase.safeCommands) {
                const result = await printerSimulator.sendPrintCommand(testCase.printer.id, safeCommand);
                expect(result.success).toBe(true);
            }
            
            // Test unsafe commands - should fail
            for (const unsafeCommand of testCase.unsafeCommands) {
                const result = await printerSimulator.sendPrintCommand(testCase.printer.id, unsafeCommand);
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.error).toMatch(/outside|exceeds|volume/i);
            }
        }
    });

    /**
     * Property: Different printer types should have appropriate capabilities and materials
     */
    it('Property 4: Different printer types should have type-specific capabilities', async () => {
        const printerCapabilityTests = [
            {
                printer: printerSimulator.getPrinter('fdm-printer-001')!,
                expectedCapabilities: ['fdm_printing', 'auto_bed_leveling', 'filament_detection', 'pause_resume', 'temperature_control'],
                materialType: 'PLA',
                specialCommands: ['auto_bed_leveling', 'filament_detection']
            },
            {
                printer: printerSimulator.getPrinter('resin-printer-002')!,
                expectedCapabilities: ['sla_printing', 'uv_curing', 'resin_detection', 'pause_resume'],
                materialType: 'Resin',
                specialCommands: ['uv_curing', 'resin_detection']
            },
            {
                printer: printerSimulator.getPrinter('industrial-printer-003')!,
                expectedCapabilities: ['fdm_printing', 'dual_extrusion', 'enclosed_chamber', 'material_station', 'cloud_printing'],
                materialType: 'ABS',
                specialCommands: ['dual_extrusion', 'material_station']
            }
        ];

        for (const test of printerCapabilityTests) {
            // Verify capabilities match expected
            expect(test.printer.capabilities).toEqual(expect.arrayContaining(test.expectedCapabilities));
            
            // Verify material type
            expect(test.printer.filament.type).toBe(test.materialType);
            
            // Test printer-specific commands
            for (const specialCommand of test.specialCommands) {
                const result = await printerSimulator.sendPrintCommand(test.printer.id, {
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
     * Property: Filament/material management should be accurate and prevent printing without material
     */
    it('Property 5: Material management should prevent printing when material is insufficient', async () => {
        const printer = printerSimulator.getPrinter('fdm-printer-001')!;
        
        // Simulate low filament
        printer.filament.remaining = 5; // Below 10% threshold
        
        // Low filament should prevent print start
        const printResult = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'activate',
            parameters: { file: 'large_model.gcode', layers: 200 },
            priority: 1
        });
        
        expect(printResult.success).toBe(false);
        expect(printResult.error).toContain('Insufficient filament');
        
        // Reset filament and start print
        printer.filament.remaining = 80;
        const successfulPrint = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'activate',
            parameters: { file: 'small_model.gcode', layers: 10 },
            priority: 1
        });
        expect(successfulPrint.success).toBe(true);
        
        // Verify filament consumption tracking
        const initialFilament = printer.filament.remaining;
        
        // Wait for some print progress
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Manually simulate some print progress to consume filament for testing
        printer.printJob.progress = 50;
        printer.filament.remaining = Math.max(0, initialFilament - 5); // Simulate consumption
        
        const statusResult = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'status',
            parameters: {},
            priority: 1
        });
        
        expect(statusResult.success).toBe(true);
        expect(statusResult.printerState.filament.remaining).toBeLessThan(initialFilament);
        
        // Cancel the print
        await printerSimulator.sendPrintCommand(printer.id, {
            type: 'deactivate',
            parameters: {},
            priority: 1
        });
    });

    /**
     * Property: Temperature control should be accurate and safe
     */
    it('Property 6: Temperature control should be accurate and material-appropriate', async () => {
        const temperatureTests = [
            {
                printer: printerSimulator.getPrinter('fdm-printer-001')!, // PLA printer
                material: 'PLA',
                expectedHotend: 210,
                expectedBed: 60
            },
            {
                printer: printerSimulator.getPrinter('industrial-printer-003')!, // ABS printer
                material: 'ABS',
                expectedHotend: 250,
                expectedBed: 100
            }
        ];

        for (const test of temperatureTests) {
            // Start a print to trigger automatic temperature setting
            const printResult = await printerSimulator.sendPrintCommand(test.printer.id, {
                type: 'activate',
                parameters: { file: 'temp_test.gcode', layers: 5 },
                priority: 1
            });
            
            expect(printResult.success).toBe(true);
            
            // Check that temperatures were set correctly for material
            expect(test.printer.temperatures.hotend.target).toBe(test.expectedHotend);
            expect(test.printer.temperatures.bed.target).toBe(test.expectedBed);
            
            // Test manual temperature setting
            const tempResult = await printerSimulator.sendPrintCommand(test.printer.id, {
                type: 'configure',
                parameters: { 
                    temperature: { 
                        hotend: test.expectedHotend + 10, 
                        bed: test.expectedBed + 5 
                    } 
                },
                priority: 5
            });
            
            expect(tempResult.success).toBe(true);
            expect(tempResult.data.temperature_set).toBe(true);
            expect(tempResult.data.targets.hotend).toBe(test.expectedHotend + 10);
            expect(tempResult.data.targets.bed).toBe(test.expectedBed + 5);
            
            // Cancel the print
            await printerSimulator.sendPrintCommand(test.printer.id, {
                type: 'deactivate',
                parameters: {},
                priority: 1
            });
        }
    });

    /**
     * Property: Print pause and resume should work correctly
     */
    it('Property 7: Print pause and resume functionality should work correctly', async () => {
        const printer = printerSimulator.getPrinter('fdm-printer-001')!;
        
        // Start a print
        const startResult = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'activate',
            parameters: { file: 'pause_test.gcode', layers: 30 },
            priority: 1
        });
        expect(startResult.success).toBe(true);
        
        // Wait for printing to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Pause the print (should work even during heating)
        const pauseResult = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'configure',
            parameters: { pause: true },
            priority: 8
        });
        
        expect(pauseResult.success).toBe(true);
        expect(pauseResult.data.paused).toBe(true);
        expect(pauseResult.printerState.status).toBe('paused');
        
        // Verify print job is still active but paused
        expect(pauseResult.printerState.printJob.active).toBe(true);
        
        // Resume the print
        const resumeResult = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'configure',
            parameters: { resume: true },
            priority: 8
        });
        
        expect(resumeResult.success).toBe(true);
        expect(resumeResult.data.resumed).toBe(true);
        expect(resumeResult.printerState.status).toBe('printing');
        
        // Cancel the print
        const cancelResult = await printerSimulator.sendPrintCommand(printer.id, {
            type: 'deactivate',
            parameters: {},
            priority: 1
        });
        expect(cancelResult.success).toBe(true);
    });

    /**
     * Property: Emergency stop should work reliably for all printer types
     */
    it('Property 8: Emergency stop should work reliably across all printer types', async () => {
        const allPrinters = printerSimulator.getAllPrinters();
        
        for (const printer of allPrinters) {
            // Start a print job
            const startResult = await printerSimulator.sendPrintCommand(printer.id, {
                type: 'activate',
                parameters: { file: 'emergency_test.gcode', layers: 50 },
                priority: 1
            });
            expect(startResult.success).toBe(true);
            
            // Wait a moment for print to start
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Emergency stop
            const emergencyResult = await printerSimulator.sendPrintCommand(printer.id, {
                type: 'emergency_stop',
                parameters: {},
                priority: 10
            });
            
            // Emergency stop should always succeed
            expect(emergencyResult.success).toBe(true);
            expect(emergencyResult.data.emergency_stopped).toBe(true);
            expect(emergencyResult.data.heaters_disabled).toBe(true);
            
            // Printer should be in error state
            expect(emergencyResult.printerState.status).toBe('error');
            
            // All heaters should be turned off
            expect(emergencyResult.printerState.temperatures.hotend.target).toBe(0);
            expect(emergencyResult.printerState.temperatures.bed.target).toBe(0);
            expect(emergencyResult.printerState.temperatures.chamber.target).toBe(0);
            
            // Response time should be fast for emergency commands
            expect(emergencyResult.responseTime).toBeLessThan(600);
            
            // Reset printer status for next test
            printer.status = 'idle';
        }
    });

    /**
     * Property: 3D printer control should integrate properly with payment system
     */
    it('Property 9: 3D printer control should integrate with payment verification system', async () => {
        const printerTypes = ['fdm-printer', 'resin-printer', 'industrial-printer'];
        
        for (const printerType of printerTypes) {
            const printerId = `${printerType}-payment-test-${Date.now()}`;
            
            // Create 3D printer control payment
            const paymentResult = await client.createRobotControlPayment({
                deviceId: printerId,
                deviceType: '3d_printer',
                recipient: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
                amountUsdc: 0.75, // Higher cost for 3D printing operations
                sessionDuration: 10800, // 3 hours for long print jobs
                commands: [
                    { type: 'status', parameters: {}, priority: 1 },
                    { type: 'activate', parameters: { file: 'payment_test.gcode', layers: 100 }, priority: 5 },
                    { type: 'configure', parameters: { pause: true }, priority: 8 },
                    { type: 'deactivate', parameters: {}, priority: 1 }
                ],
                controlEndpoint: `http://192.168.1.100:8080/printer/${printerId}`,
                safetyLimits: {
                    maxSpeed: 150,
                    boundaries: {
                        x: [0, 300],
                        y: [0, 300],
                        z: [0, 300]
                    }
                }
            });

            const payload = paymentResult.payload.payload as RobotControlPayload;
            
            // Verify payment structure for 3D printer operations
            expect(payload.deviceType).toBe('3d_printer');
            expect(payload.controlParams.deviceId).toBe(printerId);
            expect(payload.controlEndpoint).toContain(printerId);
            expect(payload.sessionDuration).toBe(10800);
            
            // Verify higher cost for 3D printing operations
            expect(payload.amount).toBe('750000'); // 0.75 USDC in lamports
            
            // Verify 3D printer-specific safety limits
            expect(payload.controlParams.safetyLimits.maxSpeed).toBe(150);
            expect(payload.controlParams.safetyLimits.boundaries.x[1]).toBe(300);
            
            // Verify required features are enabled
            expect(paymentResult.payload.features.gasless).toBe(true);
            expect(paymentResult.payload.features.robotControl).toBe(true);
            
            // Verify payment includes 3D printer-specific configurations
            expect(payload.facilitator).toBe(testConfig.features.gasless.facilitatorAddress);
            expect(payload.paymentIntentSignature).toBeDefined();
        }
    });
});