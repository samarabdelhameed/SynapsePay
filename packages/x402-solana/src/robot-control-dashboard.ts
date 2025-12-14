/**
 * Real-time Robot Control Dashboard
 * Provides a comprehensive interface for monitoring and controlling robots
 */

import { EventEmitter } from 'events';
import { 
  X402RobotControlInterface, 
  RobotDevice, 
  ControlSession, 
  DeviceStatus,
  DeviceUpdate,
  SessionUpdate,
  RobotExecutedCommand
} from './robot-control-interface';

export interface DashboardConfig {
  refreshInterval: number; // milliseconds
  maxHistoryEntries: number;
  enableRealTimeUpdates: boolean;
  theme: 'light' | 'dark';
}

export interface DashboardState {
  devices: RobotDevice[];
  activeSessions: ControlSession[];
  recentCommands: RobotExecutedCommand[];
  systemStats: SystemStats;
  alerts: DashboardAlert[];
}

export interface SystemStats {
  totalDevices: number;
  onlineDevices: number;
  activeSessions: number;
  totalRevenue: number;
  commandsExecuted: number;
  averageResponseTime: number;
  uptime: number;
}

export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  deviceId?: string;
  sessionId?: string;
  acknowledged: boolean;
}

export interface DeviceMetrics {
  deviceId: string;
  uptime: number;
  commandsExecuted: number;
  totalRevenue: number;
  averageResponseTime: number;
  errorRate: number;
  lastCommand?: RobotExecutedCommand;
}

export interface DashboardSessionMetrics {
  sessionId: string;
  duration: number;
  commandsExecuted: number;
  totalCost: number;
  averageCommandTime: number;
  successRate: number;
}

export class RobotControlDashboard extends EventEmitter {
  private state: DashboardState;
  private refreshTimer?: NodeJS.Timeout;
  private subscriptions: Map<string, () => void> = new Map();
  private startTime: number = Date.now();

  constructor(
    private robotControl: X402RobotControlInterface,
    private config: DashboardConfig = defaultDashboardConfig
  ) {
    super();
    
    this.state = {
      devices: [],
      activeSessions: [],
      recentCommands: [],
      systemStats: this.initializeSystemStats(),
      alerts: []
    };

    this.initialize();
  }

  // Public Methods
  getState(): DashboardState {
    return { ...this.state };
  }

  getDeviceMetrics(deviceId: string): DeviceMetrics | undefined {
    const device = this.state.devices.find(d => d.deviceId === deviceId);
    if (!device) return undefined;

    const sessions = this.robotControl.getSessionHistory(undefined, deviceId);
    const commands = sessions.flatMap(s => s.commands);

    return {
      deviceId,
      uptime: this.calculateDeviceUptime(device),
      commandsExecuted: commands.length,
      totalRevenue: sessions.reduce((sum, s) => sum + s.totalCost, 0),
      averageResponseTime: this.calculateAverageResponseTime(commands),
      errorRate: this.calculateErrorRate(commands),
      lastCommand: commands[commands.length - 1]
    };
  }

  getSessionMetrics(sessionId: string): DashboardSessionMetrics | undefined {
    const session = this.state.activeSessions.find(s => s.sessionId === sessionId) ||
                   this.robotControl.getSessionHistory().find(s => s.sessionId === sessionId);
    
    if (!session) return undefined;

    const duration = (session.endTime || Date.now()) - session.startTime;
    const successfulCommands = session.commands.filter(c => c.result.success);

    return {
      sessionId,
      duration,
      commandsExecuted: session.commands.length,
      totalCost: session.totalCost,
      averageCommandTime: session.commands.length > 0 
        ? session.commands.reduce((sum, c) => sum + (c.executionTime || 0), 0) / session.commands.length 
        : 0,
      successRate: session.commands.length > 0 
        ? successfulCommands.length / session.commands.length 
        : 0
    };
  }

  getSystemHealth(): SystemHealth {
    const devices = this.state.devices;
    const onlineDevices = devices.filter(d => d.status === 'online');
    const errorDevices = devices.filter(d => d.status === 'error');
    
    return {
      overall: errorDevices.length === 0 ? 'healthy' : 'degraded',
      deviceHealth: {
        total: devices.length,
        online: onlineDevices.length,
        offline: devices.filter(d => d.status === 'offline').length,
        error: errorDevices.length,
        maintenance: devices.filter(d => d.status === 'maintenance').length
      },
      sessionHealth: {
        active: this.state.activeSessions.length,
        averageDuration: this.calculateAverageSessionDuration(),
        successRate: this.calculateOverallSuccessRate()
      },
      alerts: {
        total: this.state.alerts.length,
        unacknowledged: this.state.alerts.filter(a => !a.acknowledged).length,
        critical: this.state.alerts.filter(a => a.type === 'error').length
      }
    };
  }

  // Device Management
  async startDeviceSession(deviceId: string, userId: string): Promise<string> {
    try {
      const sessionId = await this.robotControl.startSession(deviceId, userId);
      this.addAlert('success', 'Session Started', `New session ${sessionId} started for device ${deviceId}`, deviceId, sessionId);
      return sessionId;
    } catch (error) {
      this.addAlert('error', 'Session Failed', `Failed to start session: ${(error as Error).message}`, deviceId);
      throw error;
    }
  }

  async endDeviceSession(sessionId: string): Promise<void> {
    try {
      await this.robotControl.endSession(sessionId);
      this.addAlert('info', 'Session Ended', `Session ${sessionId} has been completed`);
    } catch (error) {
      this.addAlert('error', 'Session Error', `Failed to end session: ${(error as Error).message}`, undefined, sessionId);
      throw error;
    }
  }

  async executeDeviceCommand(
    sessionId: string, 
    capabilityId: string, 
    parameters: Record<string, any>
  ): Promise<any> {
    try {
      const result = await this.robotControl.executeCommand(sessionId, capabilityId, parameters);
      
      if (result.success) {
        this.addAlert('success', 'Command Executed', `Command ${capabilityId} executed successfully`);
      } else {
        this.addAlert('warning', 'Command Failed', `Command ${capabilityId} failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      this.addAlert('error', 'Command Error', `Failed to execute command: ${(error as Error).message}`, undefined, sessionId);
      throw error;
    }
  }

  // Alert Management
  acknowledgeAlert(alertId: string): void {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('stateChanged', this.state);
    }
  }

  clearAlert(alertId: string): void {
    this.state.alerts = this.state.alerts.filter(a => a.id !== alertId);
    this.emit('stateChanged', this.state);
  }

  clearAllAlerts(): void {
    this.state.alerts = [];
    this.emit('stateChanged', this.state);
  }

  // Real-time Updates
  subscribeToUpdates(callback: (state: DashboardState) => void): () => void {
    this.on('stateChanged', callback);
    return () => this.off('stateChanged', callback);
  }

  subscribeToDeviceUpdates(deviceId: string, callback: (update: DeviceUpdate) => void): () => void {
    const unsubscribe = this.robotControl.subscribeToDeviceUpdates(deviceId, callback);
    this.subscriptions.set(`device:${deviceId}`, unsubscribe);
    return () => {
      unsubscribe();
      this.subscriptions.delete(`device:${deviceId}`);
    };
  }

  subscribeToSessionUpdates(sessionId: string, callback: (update: SessionUpdate) => void): () => void {
    const unsubscribe = this.robotControl.subscribeToSessionUpdates(sessionId, callback);
    this.subscriptions.set(`session:${sessionId}`, unsubscribe);
    return () => {
      unsubscribe();
      this.subscriptions.delete(`session:${sessionId}`);
    };
  }

  // Configuration
  updateConfig(newConfig: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.refreshInterval) {
      this.setupRefreshTimer();
    }
    
    this.emit('configChanged', this.config);
  }

  // Lifecycle
  start(): void {
    this.setupEventListeners();
    this.setupRefreshTimer();
    this.refreshState();
    this.emit('started');
  }

  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Clean up subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    
    this.emit('stopped');
  }

  // Private Methods
  private initialize(): void {
    this.setupEventListeners();
    if (this.config.enableRealTimeUpdates) {
      this.setupRefreshTimer();
    }
  }

  private setupEventListeners(): void {
    // Listen to robot control events
    this.robotControl.on('deviceRegistered', (event) => {
      this.addAlert('info', 'Device Registered', `New device ${event.deviceId} has been registered`);
      this.refreshState();
    });

    this.robotControl.on('deviceUnregistered', (event) => {
      this.addAlert('warning', 'Device Unregistered', `Device ${event.deviceId} has been unregistered`);
      this.refreshState();
    });

    this.robotControl.on('sessionStarted', (event) => {
      this.addAlert('info', 'Session Started', `Session ${event.sessionId} started`);
      this.refreshState();
    });

    this.robotControl.on('sessionEnded', (event) => {
      this.addAlert('info', 'Session Ended', `Session ${event.sessionId} completed`);
      this.refreshState();
    });

    this.robotControl.on('commandExecuted', (event) => {
      this.state.recentCommands.unshift(event.executedCommand);
      if (this.state.recentCommands.length > this.config.maxHistoryEntries) {
        this.state.recentCommands = this.state.recentCommands.slice(0, this.config.maxHistoryEntries);
      }
      this.refreshSystemStats();
      this.emit('stateChanged', this.state);
    });

    this.robotControl.on('deviceError', (event) => {
      this.addAlert('error', 'Device Error', `Device ${event.deviceId}: ${event.error}`, event.deviceId);
    });

    this.robotControl.on('deviceConnected', (event) => {
      this.addAlert('success', 'Device Connected', `Device ${event.deviceId} is now online`, event.deviceId);
      this.refreshState();
    });

    this.robotControl.on('deviceDisconnected', (event) => {
      this.addAlert('warning', 'Device Disconnected', `Device ${event.deviceId} went offline`, event.deviceId);
      this.refreshState();
    });
  }

  private setupRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refreshState();
    }, this.config.refreshInterval);
  }

  private refreshState(): void {
    this.state.devices = this.robotControl.listDevices();
    this.state.activeSessions = this.robotControl.getActiveSessions();
    this.refreshSystemStats();
    this.emit('stateChanged', this.state);
  }

  private refreshSystemStats(): void {
    const devices = this.state.devices;
    const sessions = this.robotControl.getSessionHistory();
    const allCommands = sessions.flatMap(s => s.commands);

    this.state.systemStats = {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      activeSessions: this.state.activeSessions.length,
      totalRevenue: sessions.reduce((sum, s) => sum + s.totalCost, 0),
      commandsExecuted: allCommands.length,
      averageResponseTime: this.calculateAverageResponseTime(allCommands),
      uptime: Date.now() - this.startTime
    };
  }

  private initializeSystemStats(): SystemStats {
    return {
      totalDevices: 0,
      onlineDevices: 0,
      activeSessions: 0,
      totalRevenue: 0,
      commandsExecuted: 0,
      averageResponseTime: 0,
      uptime: 0
    };
  }

  private addAlert(
    type: DashboardAlert['type'], 
    title: string, 
    message: string, 
    deviceId?: string, 
    sessionId?: string
  ): void {
    const alert: DashboardAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      deviceId,
      sessionId,
      acknowledged: false
    };

    this.state.alerts.unshift(alert);
    
    // Keep only recent alerts
    if (this.state.alerts.length > this.config.maxHistoryEntries) {
      this.state.alerts = this.state.alerts.slice(0, this.config.maxHistoryEntries);
    }

    this.emit('alertAdded', alert);
    this.emit('stateChanged', this.state);
  }

  private calculateDeviceUptime(device: RobotDevice): number {
    // Simplified uptime calculation
    return Date.now() - device.lastHeartbeat;
  }

  private calculateAverageResponseTime(commands: RobotExecutedCommand[]): number {
    if (commands.length === 0) return 0;
    return commands.reduce((sum, cmd) => sum + cmd.executionTime, 0) / commands.length;
  }

  private calculateErrorRate(commands: RobotExecutedCommand[]): number {
    if (commands.length === 0) return 0;
    const failedCommands = commands.filter(cmd => !cmd.result.success);
    return failedCommands.length / commands.length;
  }

  private calculateAverageSessionDuration(): number {
    const completedSessions = this.robotControl.getSessionHistory()
      .filter(s => s.status === 'completed' && s.endTime);
    
    if (completedSessions.length === 0) return 0;
    
    return completedSessions.reduce((sum, s) => {
      return sum + (s.endTime! - s.startTime);
    }, 0) / completedSessions.length;
  }

  private calculateOverallSuccessRate(): number {
    const allSessions = this.robotControl.getSessionHistory();
    const allCommands = allSessions.flatMap(s => s.commands);
    
    if (allCommands.length === 0) return 1;
    
    const successfulCommands = allCommands.filter(c => c.result.success);
    return successfulCommands.length / allCommands.length;
  }
}

// Additional Types
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  deviceHealth: {
    total: number;
    online: number;
    offline: number;
    error: number;
    maintenance: number;
  };
  sessionHealth: {
    active: number;
    averageDuration: number;
    successRate: number;
  };
  alerts: {
    total: number;
    unacknowledged: number;
    critical: number;
  };
}

// Default Configuration
export const defaultDashboardConfig: DashboardConfig = {
  refreshInterval: 5000, // 5 seconds
  maxHistoryEntries: 100,
  enableRealTimeUpdates: true,
  theme: 'light'
};