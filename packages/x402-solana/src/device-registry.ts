/**
 * Device Registry System
 * Manages device registration, authentication, and lifecycle
 */

import { EventEmitter } from 'events';
import { 
  RobotDevice, 
  DeviceRegistration, 
  DeviceType, 
  DeviceStatus,
  RobotDeviceCapability,
  ConnectionInfo,
  DevicePricing,
  ValidationResult
} from './robot-control-interface';

export interface DeviceRegistry {
  devices: Map<string, RegisteredDevice>;
  pendingRegistrations: Map<string, PendingRegistration>;
  deviceTemplates: Map<string, DeviceTemplate>;
}

export interface RegisteredDevice extends RobotDevice {
  registrationDate: number;
  lastUpdate: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  trustScore: number;
  totalSessions: number;
  totalRevenue: number;
  averageRating: number;
  certifications: DeviceCertification[];
}

export interface PendingRegistration {
  registrationId: string;
  deviceInfo: DeviceRegistration;
  submissionDate: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewer?: string;
}

export interface DeviceTemplate {
  templateId: string;
  name: string;
  description: string;
  deviceType: DeviceType;
  defaultCapabilities: RobotDeviceCapability[];
  defaultPricing: DevicePricing;
  requiredCertifications: string[];
  configurationSchema: ConfigurationSchema;
}

export interface ConfigurationSchema {
  properties: Record<string, PropertySchema>;
  required: string[];
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface DeviceCertification {
  certificationId: string;
  name: string;
  issuer: string;
  issueDate: number;
  expiryDate: number;
  status: 'active' | 'expired' | 'revoked';
  verificationHash: string;
}

export interface RegistryConfig {
  autoApproval: boolean;
  requireCertification: boolean;
  minimumTrustScore: number;
  maxDevicesPerOwner: number;
  registrationFee: number;
  verificationTimeout: number; // milliseconds
}

export class DeviceRegistrySystem extends EventEmitter {
  private registry: DeviceRegistry;
  private config: RegistryConfig;

  constructor(config: RegistryConfig = defaultRegistryConfig) {
    super();
    this.config = config;
    this.registry = {
      devices: new Map(),
      pendingRegistrations: new Map(),
      deviceTemplates: new Map()
    };
    
    this.initializeDefaultTemplates();
  }

  // Device Registration
  async submitRegistration(registration: DeviceRegistration): Promise<string> {
    // Validate registration
    const validation = this.validateRegistration(registration);
    if (!validation.valid) {
      throw new Error(`Registration validation failed: ${validation.errors.join(', ')}`);
    }

    // Check owner device limit
    const ownerDevices = this.getDevicesByOwner(registration.deviceInfo.owner);
    if (ownerDevices.length >= this.config.maxDevicesPerOwner) {
      throw new Error(`Owner has reached maximum device limit (${this.config.maxDevicesPerOwner})`);
    }

    const registrationId = this.generateRegistrationId();
    const pendingRegistration: PendingRegistration = {
      registrationId,
      deviceInfo: registration,
      submissionDate: Date.now(),
      status: 'submitted'
    };

    this.registry.pendingRegistrations.set(registrationId, pendingRegistration);

    // Auto-approve if configured
    if (this.config.autoApproval) {
      await this.approveRegistration(registrationId, 'system');
    } else {
      pendingRegistration.status = 'under_review';
    }

    this.emit('registrationSubmitted', { registrationId, registration: pendingRegistration });
    
    return registrationId;
  }

  async approveRegistration(registrationId: string, reviewer: string): Promise<string> {
    const pending = this.registry.pendingRegistrations.get(registrationId);
    if (!pending) {
      throw new Error('Registration not found');
    }

    if (pending.status !== 'submitted' && pending.status !== 'under_review') {
      throw new Error(`Cannot approve registration with status: ${pending.status}`);
    }

    // Create device from registration
    const deviceId = this.generateDeviceId();
    const device: RegisteredDevice = {
      deviceId,
      ...pending.deviceInfo.deviceInfo,
      status: 'offline',
      lastHeartbeat: Date.now(),
      registrationDate: Date.now(),
      lastUpdate: Date.now(),
      verificationStatus: 'pending',
      trustScore: 50, // Starting trust score
      totalSessions: 0,
      totalRevenue: 0,
      averageRating: 0,
      certifications: []
    };

    // Store device
    this.registry.devices.set(deviceId, device);

    // Update pending registration
    pending.status = 'approved';
    pending.reviewer = reviewer;

    // Remove from pending (optional - keep for audit trail)
    // this.registry.pendingRegistrations.delete(registrationId);

    this.emit('registrationApproved', { registrationId, deviceId, device });
    
    return deviceId;
  }

  async rejectRegistration(registrationId: string, reviewer: string, reason: string): Promise<void> {
    const pending = this.registry.pendingRegistrations.get(registrationId);
    if (!pending) {
      throw new Error('Registration not found');
    }

    pending.status = 'rejected';
    pending.reviewer = reviewer;
    pending.reviewNotes = reason;

    this.emit('registrationRejected', { registrationId, reason });
  }

  // Device Management
  getDevice(deviceId: string): RegisteredDevice | undefined {
    return this.registry.devices.get(deviceId);
  }

  getDevicesByOwner(owner: string): RegisteredDevice[] {
    return Array.from(this.registry.devices.values())
      .filter(device => device.owner === owner);
  }

  getDevicesByType(deviceType: DeviceType): RegisteredDevice[] {
    return Array.from(this.registry.devices.values())
      .filter(device => device.type === deviceType);
  }

  getDevicesByStatus(status: DeviceStatus): RegisteredDevice[] {
    return Array.from(this.registry.devices.values())
      .filter(device => device.status === status);
  }

  listAllDevices(filter?: DeviceFilter): RegisteredDevice[] {
    let devices = Array.from(this.registry.devices.values());

    if (filter) {
      devices = devices.filter(device => {
        if (filter.type && device.type !== filter.type) return false;
        if (filter.status && device.status !== filter.status) return false;
        if (filter.owner && device.owner !== filter.owner) return false;
        if (filter.verificationStatus && device.verificationStatus !== filter.verificationStatus) return false;
        if (filter.minTrustScore && device.trustScore < filter.minTrustScore) return false;
        if (filter.maxTrustScore && device.trustScore > filter.maxTrustScore) return false;
        return true;
      });
    }

    return devices;
  }

  async updateDevice(deviceId: string, updates: Partial<RegisteredDevice>): Promise<void> {
    const device = this.registry.devices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    // Validate updates
    if (updates.capabilities) {
      const validation = this.validateCapabilities(updates.capabilities);
      if (!validation.valid) {
        throw new Error(`Invalid capabilities: ${validation.errors.join(', ')}`);
      }
    }

    // Apply updates
    const updatedDevice = { ...device, ...updates, lastUpdate: Date.now() };
    this.registry.devices.set(deviceId, updatedDevice);

    this.emit('deviceUpdated', { deviceId, device: updatedDevice, updates });
  }

  async removeDevice(deviceId: string, reason: string): Promise<void> {
    const device = this.registry.devices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    this.registry.devices.delete(deviceId);
    this.emit('deviceRemoved', { deviceId, device, reason });
  }

  // Device Verification
  async verifyDevice(deviceId: string, verificationData: DeviceVerificationData): Promise<void> {
    const device = this.registry.devices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    // Perform verification checks
    const verificationResult = await this.performDeviceVerification(device, verificationData);
    
    if (verificationResult.success) {
      device.verificationStatus = 'verified';
      device.trustScore = Math.min(100, device.trustScore + 20); // Boost trust score
      
      // Add verification certificate if provided
      if (verificationData.certificate) {
        device.certifications.push(verificationData.certificate);
      }
    } else {
      device.verificationStatus = 'rejected';
      device.trustScore = Math.max(0, device.trustScore - 10); // Reduce trust score
    }

    device.lastUpdate = Date.now();
    this.registry.devices.set(deviceId, device);

    this.emit('deviceVerified', { 
      deviceId, 
      device, 
      verificationResult 
    });
  }

  // Device Templates
  createTemplate(template: Omit<DeviceTemplate, 'templateId'>): string {
    const templateId = this.generateTemplateId();
    const deviceTemplate: DeviceTemplate = {
      templateId,
      ...template
    };

    this.registry.deviceTemplates.set(templateId, deviceTemplate);
    this.emit('templateCreated', { templateId, template: deviceTemplate });
    
    return templateId;
  }

  getTemplate(templateId: string): DeviceTemplate | undefined {
    return this.registry.deviceTemplates.get(templateId);
  }

  listTemplates(): DeviceTemplate[] {
    return Array.from(this.registry.deviceTemplates.values());
  }

  createDeviceFromTemplate(templateId: string, customization: DeviceCustomization): DeviceRegistration {
    const template = this.registry.deviceTemplates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Merge template with customization
    const deviceInfo = {
      name: customization.name,
      type: template.deviceType,
      owner: customization.owner,
      capabilities: this.mergeCapabilities(template.defaultCapabilities, customization.capabilities || []),
      connectionInfo: customization.connectionInfo,
      pricing: { ...template.defaultPricing, ...customization.pricing },
      metadata: customization.metadata || {}
    };

    return {
      deviceInfo,
      ownerSignature: customization.ownerSignature,
      timestamp: Date.now()
    };
  }

  // Statistics and Analytics
  getRegistryStats(): RegistryStats {
    const devices = Array.from(this.registry.devices.values());
    const pending = Array.from(this.registry.pendingRegistrations.values());

    return {
      totalDevices: devices.length,
      devicesByType: this.groupDevicesByType(devices),
      devicesByStatus: this.groupDevicesByStatus(devices),
      verificationStats: {
        verified: devices.filter(d => d.verificationStatus === 'verified').length,
        pending: devices.filter(d => d.verificationStatus === 'pending').length,
        rejected: devices.filter(d => d.verificationStatus === 'rejected').length
      },
      pendingRegistrations: {
        total: pending.length,
        submitted: pending.filter(p => p.status === 'submitted').length,
        underReview: pending.filter(p => p.status === 'under_review').length,
        approved: pending.filter(p => p.status === 'approved').length,
        rejected: pending.filter(p => p.status === 'rejected').length
      },
      averageTrustScore: devices.length > 0 
        ? devices.reduce((sum, d) => sum + d.trustScore, 0) / devices.length 
        : 0,
      totalRevenue: devices.reduce((sum, d) => sum + d.totalRevenue, 0)
    };
  }

  // Private Methods
  private initializeDefaultTemplates(): void {
    // Robot Arm Template
    this.createTemplate({
      name: 'Industrial Robot Arm',
      description: 'Standard 6-DOF industrial robot arm',
      deviceType: 'robot_arm',
      defaultCapabilities: [
        {
          id: 'move_to_position',
          name: 'Move to Position',
          description: 'Move robot arm to specified coordinates',
          parameters: [
            { name: 'x', type: 'number', required: true, description: 'X coordinate' },
            { name: 'y', type: 'number', required: true, description: 'Y coordinate' },
            { name: 'z', type: 'number', required: true, description: 'Z coordinate' },
            { name: 'speed', type: 'number', required: false, defaultValue: 50, description: 'Movement speed (0-100)' }
          ],
          costPerExecution: 0.01,
          executionTimeMs: 3000,
          category: 'movement'
        },
        {
          id: 'grip_object',
          name: 'Grip Object',
          description: 'Activate gripper to hold object',
          parameters: [
            { name: 'force', type: 'number', required: false, defaultValue: 50, description: 'Grip force (0-100)' }
          ],
          costPerExecution: 0.005,
          executionTimeMs: 1000,
          category: 'manipulation'
        }
      ],
      defaultPricing: {
        baseRate: 0.1,
        capabilityRates: {},
        currency: 'SOL',
        billingModel: 'per_action'
      },
      requiredCertifications: ['ISO-10218'],
      configurationSchema: {
        properties: {
          workspace: {
            type: 'object',
            description: 'Robot workspace dimensions'
          },
          maxPayload: {
            type: 'number',
            description: 'Maximum payload in kg'
          }
        },
        required: ['workspace', 'maxPayload']
      }
    });

    // Drone Template
    this.createTemplate({
      name: 'Quadcopter Drone',
      description: 'Standard quadcopter for aerial operations',
      deviceType: 'drone',
      defaultCapabilities: [
        {
          id: 'takeoff',
          name: 'Takeoff',
          description: 'Launch drone to specified altitude',
          parameters: [
            { name: 'altitude', type: 'number', required: true, description: 'Target altitude in meters' }
          ],
          costPerExecution: 0.02,
          executionTimeMs: 5000,
          category: 'movement'
        },
        {
          id: 'move_to_waypoint',
          name: 'Move to Waypoint',
          description: 'Fly to GPS coordinates',
          parameters: [
            { name: 'latitude', type: 'number', required: true, description: 'Latitude' },
            { name: 'longitude', type: 'number', required: true, description: 'Longitude' },
            { name: 'altitude', type: 'number', required: true, description: 'Altitude in meters' }
          ],
          costPerExecution: 0.05,
          executionTimeMs: 10000,
          category: 'movement'
        }
      ],
      defaultPricing: {
        baseRate: 0.2,
        capabilityRates: {},
        currency: 'SOL',
        billingModel: 'per_minute'
      },
      requiredCertifications: ['FAA-Part-107'],
      configurationSchema: {
        properties: {
          maxFlightTime: {
            type: 'number',
            description: 'Maximum flight time in minutes'
          },
          cameraResolution: {
            type: 'string',
            description: 'Camera resolution',
            enum: ['720p', '1080p', '4K']
          }
        },
        required: ['maxFlightTime']
      }
    });
  }

  private validateRegistration(registration: DeviceRegistration): ValidationResult {
    const errors: string[] = [];
    const { deviceInfo } = registration;

    // Basic validation
    if (!deviceInfo.name || deviceInfo.name.trim().length === 0) {
      errors.push('Device name is required');
    }

    if (!deviceInfo.owner || deviceInfo.owner.trim().length === 0) {
      errors.push('Device owner is required');
    }

    if (!deviceInfo.capabilities || deviceInfo.capabilities.length === 0) {
      errors.push('At least one capability is required');
    }

    // Validate capabilities
    if (deviceInfo.capabilities) {
      const capabilityValidation = this.validateCapabilities(deviceInfo.capabilities);
      if (!capabilityValidation.valid) {
        errors.push(...capabilityValidation.errors);
      }
    }

    // Validate connection info
    if (!deviceInfo.connectionInfo.endpoint) {
      errors.push('Connection endpoint is required');
    }

    // Validate pricing
    if (deviceInfo.pricing.baseRate < 0) {
      errors.push('Base rate cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateCapabilities(capabilities: RobotDeviceCapability[]): ValidationResult {
    const errors: string[] = [];

    for (const capability of capabilities) {
      if (!capability.id || capability.id.trim().length === 0) {
        errors.push('Capability ID is required');
      }

      if (!capability.name || capability.name.trim().length === 0) {
        errors.push('Capability name is required');
      }

      if (capability.costPerExecution < 0) {
        errors.push('Capability cost cannot be negative');
      }

      if (capability.executionTimeMs <= 0) {
        errors.push('Capability execution time must be positive');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async performDeviceVerification(
    device: RegisteredDevice, 
    verificationData: DeviceVerificationData
  ): Promise<VerificationResult> {
    // Simplified verification - in production would include:
    // - Hardware capability testing
    // - Security assessment
    // - Performance benchmarking
    // - Certification validation

    const checks: VerificationCheck[] = [
      {
        name: 'Connection Test',
        passed: await this.testDeviceConnection(device),
        details: 'Device connectivity verification'
      },
      {
        name: 'Capability Test',
        passed: await this.testDeviceCapabilities(device),
        details: 'Device capability verification'
      },
      {
        name: 'Security Check',
        passed: await this.performSecurityCheck(device, verificationData),
        details: 'Security and authentication verification'
      }
    ];

    const allPassed = checks.every(check => check.passed);

    return {
      success: allPassed,
      checks,
      timestamp: Date.now(),
      verifier: 'system'
    };
  }

  private async testDeviceConnection(device: RegisteredDevice): Promise<boolean> {
    // Simplified connection test
    return device.connectionInfo.endpoint.length > 0;
  }

  private async testDeviceCapabilities(device: RegisteredDevice): Promise<boolean> {
    // Simplified capability test
    return device.capabilities.length > 0;
  }

  private async performSecurityCheck(
    device: RegisteredDevice, 
    verificationData: DeviceVerificationData
  ): Promise<boolean> {
    // Simplified security check
    return (verificationData.securityToken?.length ?? 0) > 0;
  }

  private mergeCapabilities(
    templateCapabilities: RobotDeviceCapability[], 
    customCapabilities: RobotDeviceCapability[]
  ): RobotDeviceCapability[] {
    const merged = [...templateCapabilities];
    
    for (const custom of customCapabilities) {
      const existingIndex = merged.findIndex(cap => cap.id === custom.id);
      if (existingIndex >= 0) {
        merged[existingIndex] = custom; // Override template capability
      } else {
        merged.push(custom); // Add new capability
      }
    }
    
    return merged;
  }

  private groupDevicesByType(devices: RegisteredDevice[]): Record<DeviceType, number> {
    const groups: Record<string, number> = {};
    
    for (const device of devices) {
      groups[device.type] = (groups[device.type] || 0) + 1;
    }
    
    return groups as Record<DeviceType, number>;
  }

  private groupDevicesByStatus(devices: RegisteredDevice[]): Record<DeviceStatus, number> {
    const groups: Record<string, number> = {};
    
    for (const device of devices) {
      groups[device.status] = (groups[device.status] || 0) + 1;
    }
    
    return groups as Record<DeviceStatus, number>;
  }

  private generateRegistrationId(): string {
    return `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Additional Types
export interface DeviceFilter {
  type?: DeviceType;
  status?: DeviceStatus;
  owner?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  minTrustScore?: number;
  maxTrustScore?: number;
}

export interface DeviceCustomization {
  name: string;
  owner: string;
  connectionInfo: ConnectionInfo;
  capabilities?: RobotDeviceCapability[];
  pricing?: Partial<DevicePricing>;
  metadata?: Record<string, any>;
  ownerSignature: string;
}

export interface DeviceVerificationData {
  securityToken?: string;
  certificate?: DeviceCertification;
  testResults?: Record<string, any>;
}

export interface VerificationResult {
  success: boolean;
  checks: VerificationCheck[];
  timestamp: number;
  verifier: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface RegistryStats {
  totalDevices: number;
  devicesByType: Record<DeviceType, number>;
  devicesByStatus: Record<DeviceStatus, number>;
  verificationStats: {
    verified: number;
    pending: number;
    rejected: number;
  };
  pendingRegistrations: {
    total: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
  averageTrustScore: number;
  totalRevenue: number;
}

// Default Configuration
export const defaultRegistryConfig: RegistryConfig = {
  autoApproval: false,
  requireCertification: false,
  minimumTrustScore: 30,
  maxDevicesPerOwner: 10,
  registrationFee: 0.1, // SOL
  verificationTimeout: 300000 // 5 minutes
};