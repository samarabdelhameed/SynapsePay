/**
 * Tests for X402 Robot Control Interface
 * Comprehensive testing of robot control functionality
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { 
  X402RobotControlInterface,
  RobotControlDashboard,
  DeviceRegistrySystem,
  PaymentIntegrationSystem,
  defaultRobotControlConfig,
  defaultDashboardConfig,
  defaultRegistryConfig,
  defaultPaymentConfig
} from '../src';

describe('X402 Robot Control Interface', () => {
  let robotControl: X402RobotControlInterface;
  let dashboard: RobotControlDashboard;
  let deviceRegistry: DeviceRegistrySystem;
  let paymentSystem: PaymentIntegrationSystem;

  beforeEach(() => {
    robotControl = new X402RobotControlInterface(defaultRobotControlConfig);
    dashboard = new RobotControlDashboard(robotControl, defaultDashboardConfig);
    deviceRegistry = new DeviceRegistrySystem(defaultRegistryConfig);
    paymentSystem = new PaymentIntegrationSystem(defaultPaymentConfig);
  });

  describe('Device Registration', () => {
    it('should register a new robot device', async () => {
      const registration = {
        deviceInfo: {
          name: 'Test Robot Arm',
          type: 'robot_arm' as const,
          owner: 'test_owner_address',
          capabilities: [
            {
              id: 'move_to_position',
              name: 'Move to Position',
              description: 'Move robot arm to coordinates',
              parameters: [
                { name: 'x', type: 'number' as const, required: true, description: 'X coordinate' },
                { name: 'y', type: 'number' as const, required: true, description: 'Y coordinate' },
                { name: 'z', type: 'number' as const, required: true, description: 'Z coordinate' }
              ],
              costPerExecution: 0.01,
              executionTimeMs: 3000,
              category: 'movement' as const
            }
          ],
          connectionInfo: {
            protocol: 'http' as const,
            endpoint: 'http://localhost:8080/robot',
            credentials: {
              apiKey: 'test_api_key'
            }
          },
          pricing: {
            baseRate: 0.1,
            capabilityRates: {},
            currency: 'SOL' as const,
            billingModel: 'per_action' as const
          },
          metadata: {
            manufacturer: 'Test Robotics',
            model: 'TR-100'
          }
        },
        ownerSignature: 'test_signature',
        timestamp: Date.now()
      };

      const deviceId = await robotControl.registerDevice(registration);
      
      expect(deviceId).toBeDefined();
      expect(typeof deviceId).toBe('string');
      expect(deviceId.startsWith('device_')).toBe(true);

      const device = robotControl.getDeviceInfo(deviceId);
      expect(device).toBeDefined();
      expect(device!.name).toBe('Test Robot Arm');
      expect(device!.type).toBe('robot_arm');
      expect(device!.status).toBe('offline');
    });

    it('should validate device registration data', async () => {
      const invalidRegistration = {
        deviceInfo: {
          name: '', // Invalid: empty name
          type: 'robot_arm' as const,
          owner: 'test_owner',
          capabilities: [], // Invalid: no capabilities
          connectionInfo: {
            protocol: 'http' as const,
            endpoint: '', // Invalid: empty endpoint
          },
          pricing: {
            baseRate: -1, // Invalid: negative rate
            capabilityRates: {},
            currency: 'SOL' as const,
            billingModel: 'per_action' as const
          },
          metadata: {}
        },
        ownerSignature: 'test_signature',
        timestamp: Date.now()
      };

      await expect(robotControl.registerDevice(invalidRegistration)).rejects.toThrow();
    });
  });

  describe('Session Management', () => {
    let deviceId: string;

    beforeEach(async () => {
      const registration = {
        deviceInfo: {
          name: 'Test Device',
          type: 'robot_arm' as const,
          owner: 'test_owner',
          capabilities: [
            {
              id: 'test_capability',
              name: 'Test Capability',
              description: 'Test capability',
              parameters: [],
              costPerExecution: 0.01,
              executionTimeMs: 1000,
              category: 'movement' as const
            }
          ],
          connectionInfo: {
            protocol: 'http' as const,
            endpoint: 'http://localhost:8080/test'
          },
          pricing: {
            baseRate: 0.1,
            capabilityRates: {},
            currency: 'SOL' as const,
            billingModel: 'per_action' as const
          },
          metadata: {}
        },
        ownerSignature: 'test_signature',
        timestamp: Date.now()
      };

      deviceId = await robotControl.registerDevice(registration);
      
      // Simulate device coming online
      const device = robotControl.getDeviceInfo(deviceId)!;
      device.status = 'online';
    });

    it('should start a control session', async () => {
      const userId = 'test_user';
      const sessionId = await robotControl.startSession(deviceId, userId);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.startsWith('session_')).toBe(true);

      const activeSessions = robotControl.getActiveSessions();
      expect(activeSessions.length).toBe(1);
      expect(activeSessions[0].sessionId).toBe(sessionId);
      expect(activeSessions[0].deviceId).toBe(deviceId);
      expect(activeSessions[0].userId).toBe(userId);
    });

    it('should prevent multiple sessions on same device', async () => {
      const userId1 = 'user1';
      const userId2 = 'user2';

      await robotControl.startSession(deviceId, userId1);
      
      await expect(robotControl.startSession(deviceId, userId2))
        .rejects.toThrow('Device is busy');
    });

    it('should end a session and calculate costs', async () => {
      const userId = 'test_user';
      const sessionId = await robotControl.startSession(deviceId, userId);

      // Simulate some command execution
      const session = robotControl['sessions'].get(sessionId)!;
      session.totalCost = 0.05;

      const completedSession = await robotControl.endSession(sessionId);

      expect(completedSession.status).toBe('completed');
      expect(completedSession.endTime).toBeDefined();
      expect(completedSession.totalCost).toBe(0.05);
    });
  });

  describe('Command Execution', () => {
    let deviceId: string;
    let sessionId: string;

    beforeEach(async () => {
      const registration = {
        deviceInfo: {
          name: 'Test Device',
          type: 'robot_arm' as const,
          owner: 'test_owner',
          capabilities: [
            {
              id: 'move_command',
              name: 'Move Command',
              description: 'Move robot',
              parameters: [
                { name: 'x', type: 'number' as const, required: true, description: 'X position' },
                { name: 'speed', type: 'number' as const, required: false, defaultValue: 50, description: 'Speed' }
              ],
              costPerExecution: 0.02,
              executionTimeMs: 2000,
              category: 'movement' as const
            }
          ],
          connectionInfo: {
            protocol: 'http' as const,
            endpoint: 'http://localhost:8080/test'
          },
          pricing: {
            baseRate: 0.1,
            capabilityRates: {},
            currency: 'SOL' as const,
            billingModel: 'per_action' as const
          },
          metadata: {}
        },
        ownerSignature: 'test_signature',
        timestamp: Date.now()
      };

      deviceId = await robotControl.registerDevice(registration);
      
      // Set device online
      const device = robotControl.getDeviceInfo(deviceId)!;
      device.status = 'online';

      sessionId = await robotControl.startSession(deviceId, 'test_user');
    });

    it('should execute a command successfully', async () => {
      const result = await robotControl.executeCommand(
        sessionId,
        'move_command',
        { x: 100, speed: 75 }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      const session = robotControl['sessions'].get(sessionId)!;
      expect(session.commands.length).toBe(1);
      expect(session.commands[0].capabilityId).toBe('move_command');
      expect(session.commands[0].parameters).toEqual({ x: 100, speed: 75 });
      expect(session.totalCost).toBeGreaterThan(0);
    });

    it('should validate command parameters', async () => {
      await expect(robotControl.executeCommand(
        sessionId,
        'move_command',
        { speed: 75 } // Missing required 'x' parameter
      )).rejects.toThrow('Invalid parameters');
    });

    it('should reject commands for non-existent capabilities', async () => {
      await expect(robotControl.executeCommand(
        sessionId,
        'non_existent_capability',
        {}
      )).rejects.toThrow('Capability not found');
    });
  });

  describe('Device Registry System', () => {
    it('should manage device templates', () => {
      const templates = deviceRegistry.listTemplates();
      expect(templates.length).toBeGreaterThan(0);

      const robotArmTemplate = templates.find(t => t.name === 'Industrial Robot Arm');
      expect(robotArmTemplate).toBeDefined();
      expect(robotArmTemplate!.deviceType).toBe('robot_arm');
      expect(robotArmTemplate!.defaultCapabilities.length).toBeGreaterThan(0);
    });

    it('should create device from template', () => {
      const templates = deviceRegistry.listTemplates();
      const template = templates[0];

      const customization = {
        name: 'My Custom Robot',
        owner: 'test_owner',
        connectionInfo: {
          protocol: 'http' as const,
          endpoint: 'http://localhost:8080/custom'
        },
        ownerSignature: 'test_signature'
      };

      const registration = deviceRegistry.createDeviceFromTemplate(
        template.templateId,
        customization
      );

      expect(registration.deviceInfo.name).toBe('My Custom Robot');
      expect(registration.deviceInfo.type).toBe(template.deviceType);
      expect(registration.deviceInfo.capabilities.length).toBe(template.defaultCapabilities.length);
    });

    it('should track registry statistics', async () => {
      const registration = {
        deviceInfo: {
          name: 'Stats Test Device',
          type: 'drone' as const,
          owner: 'test_owner',
          capabilities: [
            {
              id: 'test_cap',
              name: 'Test Capability',
              description: 'Test',
              parameters: [],
              costPerExecution: 0.01,
              executionTimeMs: 1000,
              category: 'movement' as const
            }
          ],
          connectionInfo: {
            protocol: 'http' as const,
            endpoint: 'http://localhost:8080/test'
          },
          pricing: {
            baseRate: 0.1,
            capabilityRates: {},
            currency: 'SOL' as const,
            billingModel: 'per_action' as const
          },
          metadata: {}
        },
        ownerSignature: 'test_signature',
        timestamp: Date.now()
      };

      const registrationId = await deviceRegistry.submitRegistration(registration);
      await deviceRegistry.approveRegistration(registrationId, 'test_reviewer');

      const stats = deviceRegistry.getRegistryStats();
      expect(stats.totalDevices).toBeGreaterThan(0);
      expect(stats.devicesByType.drone).toBeGreaterThan(0);
      expect(stats.verificationStats.verified).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Payment Integration', () => {
    it('should create and process payment requests', async () => {
      const requestId = await paymentSystem.createPaymentRequest(
        'test_session',
        'test_device',
        'test_user',
        'device_owner',
        0.1,
        'Test payment'
      );

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');

      const transactionId = await paymentSystem.processPayment(
        requestId,
        'payer_address'
      );

      expect(transactionId).toBeDefined();
      expect(typeof transactionId).toBe('string');
    });

    it('should calculate revenue sharing correctly', () => {
      const amount = 1.0; // 1 SOL
      const revenueShare = paymentSystem.calculateRevenueShare(amount, 'SOL');

      expect(revenueShare.amounts.total).toBe(amount);
      expect(revenueShare.amounts.platform).toBe(0.05); // 5% platform fee
      expect(revenueShare.amounts.deviceOwner).toBe(0.95); // 95% to device owner
    });

    it('should validate payment amounts', async () => {
      // Test minimum payment validation
      await expect(paymentSystem.createPaymentRequest(
        'test_session',
        'test_device',
        'test_user',
        'device_owner',
        0.0001, // Below minimum
        'Test payment'
      )).rejects.toThrow('Payment amount below minimum');

      // Test maximum payment validation
      await expect(paymentSystem.createPaymentRequest(
        'test_session',
        'test_device',
        'test_user',
        'device_owner',
        1000, // Above maximum
        'Test payment'
      )).rejects.toThrow('Payment amount exceeds maximum');
    });
  });

  describe('Dashboard Integration', () => {
    it('should track system statistics', () => {
      const state = dashboard.getState();
      
      expect(state).toBeDefined();
      expect(state.devices).toBeInstanceOf(Array);
      expect(state.activeSessions).toBeInstanceOf(Array);
      expect(state.systemStats).toBeDefined();
      expect(state.alerts).toBeInstanceOf(Array);
    });

    it('should provide system health information', () => {
      const health = dashboard.getSystemHealth();
      
      expect(health).toBeDefined();
      expect(health.overall).toMatch(/healthy|degraded|critical/);
      expect(health.deviceHealth).toBeDefined();
      expect(health.sessionHealth).toBeDefined();
      expect(health.alerts).toBeDefined();
    });

    it('should manage alerts', () => {
      const initialAlertCount = dashboard.getState().alerts.length;
      
      // Add an alert (this would normally be triggered by events)
      dashboard['addAlert']('info', 'Test Alert', 'This is a test alert');
      
      const newAlertCount = dashboard.getState().alerts.length;
      expect(newAlertCount).toBe(initialAlertCount + 1);
      
      const latestAlert = dashboard.getState().alerts[0];
      expect(latestAlert.title).toBe('Test Alert');
      expect(latestAlert.type).toBe('info');
      expect(latestAlert.acknowledged).toBe(false);
    });
  });

  describe('Real-time Updates', () => {
    it('should emit events for device registration', (done) => {
      robotControl.on('deviceRegistered', (event) => {
        expect(event.deviceId).toBeDefined();
        expect(event.device).toBeDefined();
        done();
      });

      const registration = {
        deviceInfo: {
          name: 'Event Test Device',
          type: 'robot_arm' as const,
          owner: 'test_owner',
          capabilities: [
            {
              id: 'test_cap',
              name: 'Test Capability',
              description: 'Test',
              parameters: [],
              costPerExecution: 0.01,
              executionTimeMs: 1000,
              category: 'movement' as const
            }
          ],
          connectionInfo: {
            protocol: 'http' as const,
            endpoint: 'http://localhost:8080/test'
          },
          pricing: {
            baseRate: 0.1,
            capabilityRates: {},
            currency: 'SOL' as const,
            billingModel: 'per_action' as const
          },
          metadata: {}
        },
        ownerSignature: 'test_signature',
        timestamp: Date.now()
      };

      robotControl.registerDevice(registration);
    });

    it('should emit events for session management', (done) => {
      let eventCount = 0;
      const expectedEvents = 2; // sessionStarted and sessionEnded

      const checkCompletion = () => {
        eventCount++;
        if (eventCount === expectedEvents) {
          done();
        }
      };

      robotControl.on('sessionStarted', checkCompletion);
      robotControl.on('sessionEnded', checkCompletion);

      // Create a device and start/end session
      const registration = {
        deviceInfo: {
          name: 'Session Event Test',
          type: 'robot_arm' as const,
          owner: 'test_owner',
          capabilities: [
            {
              id: 'test_cap',
              name: 'Test Capability',
              description: 'Test',
              parameters: [],
              costPerExecution: 0.01,
              executionTimeMs: 1000,
              category: 'movement' as const
            }
          ],
          connectionInfo: {
            protocol: 'http' as const,
            endpoint: 'http://localhost:8080/test'
          },
          pricing: {
            baseRate: 0.1,
            capabilityRates: {},
            currency: 'SOL' as const,
            billingModel: 'per_action' as const
          },
          metadata: {}
        },
        ownerSignature: 'test_signature',
        timestamp: Date.now()
      };

      robotControl.registerDevice(registration).then(deviceId => {
        // Set device online
        const device = robotControl.getDeviceInfo(deviceId)!;
        device.status = 'online';

        return robotControl.startSession(deviceId, 'test_user');
      }).then(sessionId => {
        return robotControl.endSession(sessionId);
      });
    });
  });
});