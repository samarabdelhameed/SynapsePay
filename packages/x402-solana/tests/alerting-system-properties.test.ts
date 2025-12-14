/**
 * Property-Based Tests for Alerting System
 * **Feature: synapsepay-enhancements, Property 20: إرسال التنبيهات**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { 
    MonitoringSystem,
    Alert,
    AlertRule
} from '../src';

describe('Alerting System Properties', () => {
    let monitoringSystem: MonitoringSystem;

    beforeEach(() => {
        monitoringSystem = new MonitoringSystem({
            enableAnalytics: true,
            enablePerformanceMonitoring: true,
            enableErrorTracking: true,
            enableAlerting: true,
            enableUsageAnalytics: true,
            maxDataRetention: 24, // 24 hours
            alertingEndpoint: 'https://alerts.synapsepay.com/webhook'
        });
    });

    /**
     * **Feature: synapsepay-enhancements, Property 20: إرسال التنبيهات**
     * Property: For any problem that occurs, immediate alerts should be sent to administrators
     */
    it('Property 1: Should send immediate alerts for all problems to administrators', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        ruleId: fc.oneof(
                            fc.constant('error_threshold'),
                            fc.constant('performance_degradation'),
                            fc.constant('security_breach'),
                            fc.constant('system_overload')
                        ),
                        severity: fc.oneof(
                            fc.constant('low'),
                            fc.constant('medium'),
                            fc.constant('high'),
                            fc.constant('critical')
                        ),
                        message: fc.string({ minLength: 10, maxLength: 100 }),
                        data: fc.record({
                            component: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
                            value: fc.option(fc.integer({ min: 1, max: 10000 })),
                            threshold: fc.option(fc.integer({ min: 100, max: 5000 })),
                            userId: fc.option(fc.string({ minLength: 5, maxLength: 20 }))
                        })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                async (alertRequests) => {
                    // Create fresh monitoring system for this test
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24,
                        alertingEndpoint: 'https://test-alerts.synapsepay.com/webhook'
                    });

                    // Send all alert requests
                    const alertResults: boolean[] = [];
                    for (const alertRequest of alertRequests) {
                        const result = await testMonitoringSystem.sendAlert(alertRequest);
                        alertResults.push(result);
                    }

                    // Get active alerts
                    const activeAlerts = testMonitoringSystem.getActiveAlerts();

                    // Property: All alerts should be sent successfully
                    for (const result of alertResults) {
                        expect(result).toBe(true);
                    }

                    // Property: All alerts should be recorded as active
                    expect(activeAlerts.total).toBe(alertRequests.length);

                    // Property: Alerts should be categorized by severity correctly
                    const expectedBySeverity: Record<string, number> = {};
                    for (const alertRequest of alertRequests) {
                        expectedBySeverity[alertRequest.severity] = (expectedBySeverity[alertRequest.severity] || 0) + 1;
                    }
                    expect(activeAlerts.bySeverity).toEqual(expectedBySeverity);

                    // Property: All alerts should initially be unacknowledged
                    expect(activeAlerts.unacknowledged.length).toBe(alertRequests.length);

                    // Property: Recent alerts should contain the latest entries
                    expect(activeAlerts.recent.length).toBeLessThanOrEqual(10);
                    if (alertRequests.length <= 10) {
                        expect(activeAlerts.recent.length).toBe(alertRequests.length);
                    }

                    // Property: All active alerts should have required fields
                    for (const alert of activeAlerts.unacknowledged) {
                        expect(alert.id).toBeTruthy();
                        expect(alert.timestamp).toBeGreaterThan(0);
                        expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
                        expect(alert.message).toBeTruthy();
                        expect(typeof alert.data).toBe('object');
                        expect(alert.acknowledged).toBe(false);
                        expect(alert.resolved).toBe(false);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle empty alerting data gracefully
     */
    it('Property 2: Should handle empty alerting data correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(null), // No alerts to send
                async (_) => {
                    // Create fresh monitoring system with no alerts
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    const activeAlerts = testMonitoringSystem.getActiveAlerts();

                    // Property: Empty alerting should have zero counts
                    expect(activeAlerts.total).toBe(0);
                    expect(Object.keys(activeAlerts.bySeverity)).toHaveLength(0);
                    expect(activeAlerts.unacknowledged).toHaveLength(0);
                    expect(activeAlerts.recent).toHaveLength(0);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle concurrent alert sending
     */
    it('Property 3: Should handle concurrent alert sending correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    concurrentAlerts: fc.integer({ min: 5, max: 15 }),
                    severityLevels: fc.array(
                        fc.oneof(
                            fc.constant('low'),
                            fc.constant('medium'),
                            fc.constant('high'),
                            fc.constant('critical')
                        ),
                        { minLength: 1, maxLength: 4 }
                    )
                }),
                async ({ concurrentAlerts, severityLevels }) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24,
                        alertingEndpoint: 'https://test-alerts.synapsepay.com/webhook'
                    });

                    // Send concurrent alerts
                    const alertPromises = Array.from({ length: concurrentAlerts }, (_, i) => {
                        const severity = severityLevels[i % severityLevels.length];
                        return testMonitoringSystem.sendAlert({
                            ruleId: 'concurrent_test',
                            severity: severity as any,
                            message: `Concurrent alert ${i}`,
                            data: { index: i, concurrent: true }
                        });
                    });

                    const results = await Promise.all(alertPromises);

                    const activeAlerts = testMonitoringSystem.getActiveAlerts();

                    // Property: All concurrent alerts should be sent successfully
                    for (const result of results) {
                        expect(result).toBe(true);
                    }

                    // Property: All alerts should be recorded
                    expect(activeAlerts.total).toBe(concurrentAlerts);

                    // Property: Severity distribution should match expected
                    let totalBySeverity = 0;
                    for (const count of Object.values(activeAlerts.bySeverity)) {
                        totalBySeverity += count;
                    }
                    expect(totalBySeverity).toBe(concurrentAlerts);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle alert acknowledgment and resolution correctly
     */
    it('Property 4: Should handle alert acknowledgment and resolution correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        ruleId: fc.string({ minLength: 5, maxLength: 20 }),
                        severity: fc.oneof(fc.constant('medium'), fc.constant('high')),
                        message: fc.string({ minLength: 10, maxLength: 50 }),
                        data: fc.object(),
                        shouldAcknowledge: fc.boolean(),
                        shouldResolve: fc.boolean()
                    }),
                    { minLength: 5, maxLength: 15 }
                ),
                async (alertRequests) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24,
                        alertingEndpoint: 'https://test-alerts.synapsepay.com/webhook'
                    });

                    // Send alerts and collect IDs
                    const alertIds: string[] = [];
                    for (const alertRequest of alertRequests) {
                        await testMonitoringSystem.sendAlert(alertRequest);
                    }

                    // Get initial alerts to extract IDs
                    const initialAlerts = testMonitoringSystem.getActiveAlerts();
                    const allAlertIds = initialAlerts.unacknowledged.map(a => a.id);

                    // Acknowledge and resolve alerts based on flags
                    const acknowledgedIds: string[] = [];
                    const resolvedIds: string[] = [];

                    for (let i = 0; i < alertRequests.length && i < allAlertIds.length; i++) {
                        const alertId = allAlertIds[i];
                        
                        if (alertRequests[i].shouldAcknowledge) {
                            const acknowledged = testMonitoringSystem.acknowledgeAlert(alertId);
                            expect(acknowledged).toBe(true);
                            acknowledgedIds.push(alertId);
                        }
                        
                        if (alertRequests[i].shouldResolve) {
                            const resolved = testMonitoringSystem.resolveAlert(alertId);
                            expect(resolved).toBe(true);
                            resolvedIds.push(alertId);
                        }
                    }

                    const finalAlerts = testMonitoringSystem.getActiveAlerts();

                    // Property: Total alerts should remain the same
                    expect(finalAlerts.total).toBe(alertRequests.length);

                    // Property: Unacknowledged alerts should exclude acknowledged ones
                    const expectedUnacknowledged = alertRequests.length - acknowledgedIds.length;
                    expect(finalAlerts.unacknowledged.length).toBe(expectedUnacknowledged);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should maintain alert data integrity with large datasets
     */
    it('Property 5: Should maintain alert data integrity with large datasets', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 30, max: 100 }),
                async (alertCount) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 48,
                        alertingEndpoint: 'https://test-alerts.synapsepay.com/webhook'
                    });

                    // Send large number of alerts
                    const severities = ['low', 'medium', 'high', 'critical'];
                    const ruleIds = ['error_threshold', 'performance_degradation', 'security_breach'];
                    
                    for (let i = 0; i < alertCount; i++) {
                        const severity = severities[i % severities.length];
                        const ruleId = ruleIds[i % ruleIds.length];
                        
                        await testMonitoringSystem.sendAlert({
                            ruleId,
                            severity: severity as any,
                            message: `Alert ${i}: ${severity} level`,
                            data: { batch: Math.floor(i / 10), index: i }
                        });
                    }

                    const activeAlerts = testMonitoringSystem.getActiveAlerts();

                    // Property: Total count should match alert count
                    expect(activeAlerts.total).toBe(alertCount);

                    // Property: All severities should be represented
                    const totalBySeverity = Object.values(activeAlerts.bySeverity)
                        .reduce((sum, count) => sum + count, 0);
                    expect(totalBySeverity).toBe(alertCount);

                    // Property: Recent alerts should be limited to 10
                    expect(activeAlerts.recent.length).toBeLessThanOrEqual(10);

                    // Property: All alerts should initially be unacknowledged
                    expect(activeAlerts.unacknowledged.length).toBe(alertCount);

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property: Should reject operations when alerting is disabled
     */
    it('Property 6: Should handle disabled alerting correctly', async () => {
        const disabledMonitoringSystem = new MonitoringSystem({
            enableAnalytics: true,
            enablePerformanceMonitoring: true,
            enableErrorTracking: true,
            enableAlerting: false,
            enableUsageAnalytics: true,
            maxDataRetention: 24
        });

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    ruleId: fc.constant('test_rule'),
                    severity: fc.oneof(fc.constant('medium'), fc.constant('high')),
                    message: fc.string({ minLength: 10, maxLength: 50 }),
                    data: fc.object()
                }),
                async (alertRequest) => {
                    // Test alert sending (should return false)
                    const result = await disabledMonitoringSystem.sendAlert(alertRequest);
                    expect(result).toBe(false);

                    // Test alerts access (should throw)
                    expect(() => {
                        disabledMonitoringSystem.getActiveAlerts();
                    }).toThrow('Alerting is not enabled');

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should provide consistent alerting data across multiple calls
     */
    it('Property 7: Should provide consistent alerting data', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        ruleId: fc.oneof(fc.constant('rule1'), fc.constant('rule2')),
                        severity: fc.oneof(fc.constant('low'), fc.constant('high')),
                        message: fc.string({ minLength: 10, maxLength: 50 }),
                        data: fc.object()
                    }),
                    { minLength: 8, maxLength: 15 }
                ),
                async (alertRequests) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24,
                        alertingEndpoint: 'https://test-alerts.synapsepay.com/webhook'
                    });

                    // Send all alerts
                    for (const alertRequest of alertRequests) {
                        await testMonitoringSystem.sendAlert(alertRequest);
                    }

                    // Get alerting data multiple times
                    const alerts1 = testMonitoringSystem.getActiveAlerts();
                    const alerts2 = testMonitoringSystem.getActiveAlerts();
                    const alerts3 = testMonitoringSystem.getActiveAlerts();

                    // Property: Multiple calls should return consistent data
                    expect(alerts1.total).toBe(alerts2.total);
                    expect(alerts2.total).toBe(alerts3.total);
                    
                    expect(alerts1.bySeverity).toEqual(alerts2.bySeverity);
                    expect(alerts2.bySeverity).toEqual(alerts3.bySeverity);
                    
                    expect(alerts1.unacknowledged.length).toBe(alerts2.unacknowledged.length);
                    expect(alerts2.unacknowledged.length).toBe(alerts3.unacknowledged.length);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle different alert types and data correctly
     */
    it('Property 8: Should handle various alert types and data structures', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        ruleId: fc.string({ minLength: 3, maxLength: 30 }),
                        severity: fc.oneof(
                            fc.constant('low'),
                            fc.constant('medium'),
                            fc.constant('high'),
                            fc.constant('critical')
                        ),
                        message: fc.string({ minLength: 5, maxLength: 150 }),
                        data: fc.record({
                            stringField: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
                            numberField: fc.option(fc.integer({ min: -1000, max: 1000 })),
                            booleanField: fc.option(fc.boolean()),
                            arrayField: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 5 })),
                            nestedObject: fc.option(fc.record({
                                nested: fc.string({ minLength: 1, maxLength: 20 })
                            }))
                        })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                async (complexAlerts) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24,
                        alertingEndpoint: 'https://test-alerts.synapsepay.com/webhook'
                    });

                    // Send all complex alerts
                    const results: boolean[] = [];
                    for (const alertRequest of complexAlerts) {
                        const result = await testMonitoringSystem.sendAlert(alertRequest);
                        results.push(result);
                    }

                    const activeAlerts = testMonitoringSystem.getActiveAlerts();

                    // Property: All alerts should be sent successfully regardless of complexity
                    for (const result of results) {
                        expect(result).toBe(true);
                    }

                    // Property: All alerts should be recorded
                    expect(activeAlerts.total).toBe(complexAlerts.length);

                    // Property: All unique severities should be represented
                    const uniqueSeverities = new Set(complexAlerts.map(a => a.severity));
                    expect(Object.keys(activeAlerts.bySeverity)).toHaveLength(uniqueSeverities.size);

                    // Property: All alerts should preserve data structure
                    for (const alert of activeAlerts.unacknowledged) {
                        expect(typeof alert.data).toBe('object');
                        expect(alert.timestamp).toBeGreaterThan(0);
                        expect(alert.id).toBeTruthy();
                        expect(alert.ruleId).toBeTruthy();
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle alert endpoint failures gracefully
     */
    it('Property 9: Should handle alert endpoint failures gracefully', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        ruleId: fc.constant('test_rule'),
                        severity: fc.oneof(fc.constant('medium'), fc.constant('high')),
                        message: fc.string({ minLength: 10, maxLength: 50 }),
                        data: fc.object()
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                async (alertRequests) => {
                    // Create fresh monitoring system without endpoint for each test
                    const monitoringWithoutEndpoint = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: false, // Disable to avoid side effects
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                        // No alertingEndpoint specified
                    });

                    // Send alerts without endpoint
                    const results: boolean[] = [];
                    for (const alertRequest of alertRequests) {
                        const result = await monitoringWithoutEndpoint.sendAlert(alertRequest);
                        results.push(result);
                    }

                    const activeAlerts = monitoringWithoutEndpoint.getActiveAlerts();

                    // Property: Alerts should still be recorded even if endpoint fails
                    expect(activeAlerts.total).toBe(alertRequests.length);

                    // Property: Results should indicate success (internal recording)
                    for (const result of results) {
                        expect(result).toBe(true);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});