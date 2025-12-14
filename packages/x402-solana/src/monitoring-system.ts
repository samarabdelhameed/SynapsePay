/**
 * Advanced Monitoring and Analytics System for SynapsePay
 * Provides comprehensive monitoring, analytics, error tracking, and alerting capabilities
 */

export interface AnalyticsData {
  timestamp: number;
  type: 'payment' | 'transaction' | 'user_action' | 'system_event' | 'error';
  category: string;
  value: number;
  metadata: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  threshold?: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface ErrorEvent {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  context: Record<string, any>;
  userId?: string;
  sessionId?: string;
  resolved: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  recipients: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  acknowledged: boolean;
  resolved: boolean;
}

export interface UsagePattern {
  userId?: string;
  sessionId: string;
  actions: string[];
  duration: number;
  timestamp: number;
  deviceInfo: {
    platform: string;
    userAgent?: string;
    screenSize?: string;
  };
}

export class MonitoringSystem {
  private analyticsData: AnalyticsData[] = [];
  private performanceMetrics: Map<string, PerformanceMetric[]> = new Map();
  private errorEvents: ErrorEvent[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private usagePatterns: UsagePattern[] = [];
  private isEnabled: boolean;

  constructor(
    private config: {
      enableAnalytics: boolean;
      enablePerformanceMonitoring: boolean;
      enableErrorTracking: boolean;
      enableAlerting: boolean;
      enableUsageAnalytics: boolean;
      maxDataRetention: number; // in hours
      alertingEndpoint?: string;
    }
  ) {
    this.isEnabled = true;
    this.initializeDefaultAlertRules();
  }

  /**
   * Record analytics data
   */
  recordAnalytics(data: Omit<AnalyticsData, 'timestamp'>): void {
    if (!this.config.enableAnalytics || !this.isEnabled) {
      return;
    }

    const analyticsEntry: AnalyticsData = {
      ...data,
      timestamp: Date.now()
    };

    this.analyticsData.push(analyticsEntry);
    this.cleanupOldData();
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'status'>): void {
    if (!this.config.enablePerformanceMonitoring || !this.isEnabled) {
      return;
    }

    const status = this.determineMetricStatus(metric.value, metric.threshold);
    const performanceMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      status
    };

    if (!this.performanceMetrics.has(metric.name)) {
      this.performanceMetrics.set(metric.name, []);
    }

    this.performanceMetrics.get(metric.name)!.push(performanceMetric);
    this.checkAlertRules(performanceMetric);
    this.cleanupOldMetrics();
  }

  /**
   * Track error event
   */
  trackError(error: Omit<ErrorEvent, 'id' | 'timestamp' | 'resolved'>): string {
    if (!this.config.enableErrorTracking || !this.isEnabled) {
      return '';
    }

    const errorEvent: ErrorEvent = {
      ...error,
      id: this.generateId(),
      timestamp: Date.now(),
      resolved: false
    };

    this.errorEvents.push(errorEvent);
    
    // Create alert for critical errors
    if (error.level === 'critical' || error.level === 'error') {
      this.triggerAlert('error_threshold', {
        error: errorEvent,
        message: `${error.level.toUpperCase()}: ${error.message}`
      });
    }

    this.cleanupOldErrors();
    return errorEvent.id;
  }

  /**
   * Send alert notification
   */
  async sendAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Promise<boolean> {
    if (!this.config.enableAlerting || !this.isEnabled) {
      return false;
    }

    const alertEvent: Alert = {
      ...alert,
      id: this.generateId(),
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    };

    this.activeAlerts.set(alertEvent.id, alertEvent);

    // Simulate sending alert (in real implementation, this would call external services)
    if (this.config.alertingEndpoint) {
      try {
        // Simulate HTTP request
        await new Promise(resolve => setTimeout(resolve, 1));
        return true;
      } catch (error) {
        this.trackError({
          level: 'error',
          message: 'Failed to send alert',
          context: { alertId: alertEvent.id, error: error instanceof Error ? error.message : 'Unknown error' }
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Analyze usage patterns
   */
  analyzeUsagePattern(pattern: Omit<UsagePattern, 'timestamp'>): void {
    if (!this.config.enableUsageAnalytics || !this.isEnabled) {
      return;
    }

    const usagePattern: UsagePattern = {
      ...pattern,
      timestamp: Date.now()
    };

    this.usagePatterns.push(usagePattern);
    this.cleanupOldUsageData();
  }

  /**
   * Get analytics dashboard data
   */
  getAnalyticsDashboard(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByCategory: Record<string, number>;
    recentEvents: AnalyticsData[];
    trends: {
      hourly: Record<string, number>;
      daily: Record<string, number>;
    };
  } {
    if (!this.config.enableAnalytics) {
      throw new Error('Analytics is not enabled');
    }

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const eventsByType: Record<string, number> = {};
    const eventsByCategory: Record<string, number> = {};
    const hourlyTrends: Record<string, number> = {};
    const dailyTrends: Record<string, number> = {};

    for (const event of this.analyticsData) {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by category
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
      
      // Hourly trends
      const hourKey = new Date(event.timestamp).toISOString().slice(0, 13);
      hourlyTrends[hourKey] = (hourlyTrends[hourKey] || 0) + 1;
      
      // Daily trends
      const dayKey = new Date(event.timestamp).toISOString().slice(0, 10);
      dailyTrends[dayKey] = (dailyTrends[dayKey] || 0) + 1;
    }

    return {
      totalEvents: this.analyticsData.length,
      eventsByType,
      eventsByCategory,
      recentEvents: this.analyticsData.slice(-50),
      trends: {
        hourly: hourlyTrends,
        daily: dailyTrends
      }
    };
  }

  /**
   * Get performance monitoring data
   */
  getPerformanceMonitoring(): {
    metrics: Record<string, PerformanceMetric[]>;
    currentStatus: Record<string, 'normal' | 'warning' | 'critical'>;
    averages: Record<string, number>;
    alerts: Alert[];
  } {
    if (!this.config.enablePerformanceMonitoring) {
      throw new Error('Performance monitoring is not enabled');
    }

    const currentStatus: Record<string, 'normal' | 'warning' | 'critical'> = {};
    const averages: Record<string, number> = {};

    for (const [metricName, metrics] of this.performanceMetrics) {
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        currentStatus[metricName] = latest.status;
        
        const sum = metrics.reduce((acc, m) => acc + m.value, 0);
        averages[metricName] = sum / metrics.length;
      }
    }

    const performanceAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.ruleId.includes('performance'));

    return {
      metrics: Object.fromEntries(this.performanceMetrics),
      currentStatus,
      averages,
      alerts: performanceAlerts
    };
  }

  /**
   * Get error tracking data
   */
  getErrorTracking(): {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    recentErrors: ErrorEvent[];
    unresolvedErrors: ErrorEvent[];
    errorTrends: Record<string, number>;
  } {
    if (!this.config.enableErrorTracking) {
      throw new Error('Error tracking is not enabled');
    }

    const errorsByLevel: Record<string, number> = {};
    const errorTrends: Record<string, number> = {};

    for (const error of this.errorEvents) {
      errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + 1;
      
      const dayKey = new Date(error.timestamp).toISOString().slice(0, 10);
      errorTrends[dayKey] = (errorTrends[dayKey] || 0) + 1;
    }

    return {
      totalErrors: this.errorEvents.length,
      errorsByLevel,
      recentErrors: this.errorEvents.slice(-20),
      unresolvedErrors: this.errorEvents.filter(e => !e.resolved),
      errorTrends
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): {
    total: number;
    bySeverity: Record<string, number>;
    unacknowledged: Alert[];
    recent: Alert[];
  } {
    if (!this.config.enableAlerting) {
      throw new Error('Alerting is not enabled');
    }

    const alerts = Array.from(this.activeAlerts.values());
    const bySeverity: Record<string, number> = {};

    for (const alert of alerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    }

    return {
      total: alerts.length,
      bySeverity,
      unacknowledged: alerts.filter(a => !a.acknowledged),
      recent: alerts.slice(-10)
    };
  }

  /**
   * Get usage analytics
   */
  getUsageAnalytics(): {
    totalSessions: number;
    averageSessionDuration: number;
    topActions: Record<string, number>;
    platformDistribution: Record<string, number>;
    userPatterns: {
      activeUsers: number;
      returningUsers: number;
      newUsers: number;
    };
  } {
    if (!this.config.enableUsageAnalytics) {
      throw new Error('Usage analytics is not enabled');
    }

    const topActions: Record<string, number> = {};
    const platformDistribution: Record<string, number> = {};
    const userIds = new Set<string>();
    let totalDuration = 0;

    for (const pattern of this.usagePatterns) {
      // Count actions
      for (const action of pattern.actions) {
        topActions[action] = (topActions[action] || 0) + 1;
      }
      
      // Platform distribution
      platformDistribution[pattern.deviceInfo.platform] = 
        (platformDistribution[pattern.deviceInfo.platform] || 0) + 1;
      
      // User tracking
      if (pattern.userId && typeof pattern.userId === 'string' && pattern.userId.trim().length > 0) {
        userIds.add(pattern.userId);
      }
      
      totalDuration += pattern.duration;
    }

    return {
      totalSessions: this.usagePatterns.length,
      averageSessionDuration: this.usagePatterns.length > 0 ? totalDuration / this.usagePatterns.length : 0,
      topActions,
      platformDistribution,
      userPatterns: {
        activeUsers: userIds.size,
        returningUsers: Math.floor(userIds.size * 0.7), // Mock calculation
        newUsers: userIds.size - Math.floor(userIds.size * 0.7) // Ensure they sum to activeUsers
      }
    };
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Resolve error
   */
  resolveError(errorId: string): boolean {
    const error = this.errorEvents.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    overall: 'healthy' | 'warning' | 'critical';
    components: {
      analytics: 'enabled' | 'disabled';
      performance: 'enabled' | 'disabled';
      errorTracking: 'enabled' | 'disabled';
      alerting: 'enabled' | 'disabled';
      usageAnalytics: 'enabled' | 'disabled';
    };
    metrics: {
      dataPoints: number;
      errorRate: number;
      alertCount: number;
      uptime: number;
    };
  } {
    const criticalAlerts = Array.from(this.activeAlerts.values())
      .filter(a => a.severity === 'critical' && !a.resolved).length;
    
    const recentErrors = this.errorEvents
      .filter(e => e.timestamp > Date.now() - 60 * 60 * 1000 && !e.resolved).length;

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts > 0 || recentErrors > 10) {
      overall = 'critical';
    } else if (recentErrors > 5) {
      overall = 'warning';
    }

    return {
      overall,
      components: {
        analytics: this.config.enableAnalytics ? 'enabled' : 'disabled',
        performance: this.config.enablePerformanceMonitoring ? 'enabled' : 'disabled',
        errorTracking: this.config.enableErrorTracking ? 'enabled' : 'disabled',
        alerting: this.config.enableAlerting ? 'enabled' : 'disabled',
        usageAnalytics: this.config.enableUsageAnalytics ? 'enabled' : 'disabled'
      },
      metrics: {
        dataPoints: this.analyticsData.length,
        errorRate: this.errorEvents.length > 0 ? recentErrors / this.errorEvents.length : 0,
        alertCount: this.activeAlerts.size,
        uptime: 99.9 // Mock uptime percentage
      }
    };
  }

  // Private helper methods

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'error_threshold',
        name: 'High Error Rate',
        condition: 'error_rate > threshold',
        threshold: 5,
        severity: 'high',
        enabled: true,
        recipients: ['admin@synapsepay.com']
      },
      {
        id: 'performance_degradation',
        name: 'Performance Degradation',
        condition: 'response_time > threshold',
        threshold: 1000,
        severity: 'medium',
        enabled: true,
        recipients: ['ops@synapsepay.com']
      }
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  private determineMetricStatus(value: number, threshold?: number): 'normal' | 'warning' | 'critical' {
    if (!threshold) return 'normal';
    
    if (value > threshold * 1.5) return 'critical';
    if (value > threshold) return 'warning';
    return 'normal';
  }

  private checkAlertRules(metric: PerformanceMetric): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      
      if (rule.condition.includes('response_time') && metric.name.includes('response_time')) {
        if (metric.value > rule.threshold) {
          this.triggerAlert(rule.id, {
            message: `${rule.name}: ${metric.name} = ${metric.value}${metric.unit}`,
            severity: rule.severity,
            data: metric
          });
        }
      }
    }
  }

  private async triggerAlert(ruleId: string, data: any): Promise<void> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return;

    await this.sendAlert({
      ruleId,
      severity: rule.severity,
      message: data.message || rule.name,
      data
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - (this.config.maxDataRetention * 60 * 60 * 1000);
    this.analyticsData = this.analyticsData.filter(d => d.timestamp > cutoff);
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (this.config.maxDataRetention * 60 * 60 * 1000);
    for (const [name, metrics] of this.performanceMetrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      this.performanceMetrics.set(name, filtered);
    }
  }

  private cleanupOldErrors(): void {
    const cutoff = Date.now() - (this.config.maxDataRetention * 60 * 60 * 1000);
    this.errorEvents = this.errorEvents.filter(e => e.timestamp > cutoff);
  }

  private cleanupOldUsageData(): void {
    const cutoff = Date.now() - (this.config.maxDataRetention * 60 * 60 * 1000);
    this.usagePatterns = this.usagePatterns.filter(p => p.timestamp > cutoff);
  }
}