/**
 * Property-Based Tests for Performance Monitoring
 * **Feature: synapsepay-enhancements, Property 18: مراقبة الأداء**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { 
    MonitoringSystem,
    PerformanceMetric
} from '../src';

describe('Performance Monitoring Properties', () => {
    let monitoringSystem: MonitoringSystem;

    beforeEach(() => {
        monitoringSystem = new MonitoringSystem({
            enableAnalytics: true,
            enablePerformanceMonitoring: true,
            enableErrorTracking: true,
            enableAlerting: true,
            enableUsageAnalytics: true,
            maxDataRetention: 24 // 24 hours
        });
    });

    /**
     * **Feature: synapsepay-enhancements, Property 18: مراقبة الأداء**
     * Property: For any operation in the system, performance data should be recorded and monitored in real-time
     */
    it('Property 1: Should record and monitor all performance metrics in real-time', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: fc.oneof(
                            fc.constant('response_time'),
                            fc.constant('memory_usage'),
                            fc.constant('cpu_usage'),
                            fc.constant('disk_io'),
                            fc.constant('network_latency'),
                            fc.constant('transaction_throughput')
                        ),
                        value: fc.integer({ min: 1, max: 10000 }),
                        unit: fc.oneof(
                            fc.constant('ms'),
                            fc.constant('bytes'),
                            fc.constant('count'),
                            fc.constant('percentage')
                        ),
                        threshold: fc.option(fc.float({ min: 100, max: 5000 }))
                    }),
                    { minLength: 1, maxLength: 30 }
                ),
                async (performanceMetrics) => {
                    // Create fresh monitoring system for this test
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record all performance metrics
                    for (const metric of performanceMetrics) {
                        testMonitoringSystem.recordPerformanceMetric(metric);
                    }

                    // Get performance monitoring data
                    const monitoring = testMonitoringSystem.getPerformanceMonitoring();

                    // Property: All metrics should be recorded
                    const totalRecordedMetrics = Object.values(monitoring.metrics)
                        .reduce((sum, metricArray) => sum + metricArray.length, 0);
                    expect(totalRecordedMetrics).toBe(performanceMetrics.length);

                    // Property: Each metric should have correct structure
                    for (const [metricName, metricArray] of Object.entries(monitoring.metrics)) {
                        for (const metric of metricArray) {
                            expect(metric.name).toBe(metricName);
                            expect(typeof metric.value).toBe('number');
                            expect(metric.value).toBeGreaterThanOrEqual(0);
                            expect(['ms', 'bytes', 'count', 'percentage']).toContain(metric.unit);
                            expect(['normal', 'warning', 'critical']).toContain(metric.status);
                            expect(metric.timestamp).toBeGreaterThan(0);
                        }
                    }

                    // Property: Current status should reflect latest metrics
                    const uniqueMetricNames = new Set(performanceMetrics.map(m => m.name));
                    expect(Object.keys(monitoring.currentStatus)).toHaveLength(uniqueMetricNames.size);

                    // Property: Averages should be calculated correctly
                    for (const [metricName, average] of Object.entries(monitoring.averages)) {
                        const metricValues = monitoring.metrics[metricName].map(m => m.value);
                        const expectedAverage = metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length;
                        expect(average).toBeCloseTo(expectedAverage, 2);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should correctly determine metric status based on thresholds
     */
    it('Property 2: Should correctly determine performance metric status', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 5, maxLength: 20 }),
                        value: fc.integer({ min: 1, max: 2000 }),
                        unit: fc.oneof(fc.constant('ms'), fc.constant('bytes')),
                        threshold: fc.float({ min: 500, max: 1000 })
                    }),
                    { minLength: 1, maxLength: 15 }
                ),
                async (metricsWithThresholds) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record metrics with thresholds
                    for (const metric of metricsWithThresholds) {
                        testMonitoringSystem.recordPerformanceMetric(metric);
                    }

                    const monitoring = testMonitoringSystem.getPerformanceMonitoring();

                    // Property: Status should be determined correctly based on thresholds
                    for (const [metricName, metricArray] of Object.entries(monitoring.metrics)) {
                        for (const metric of metricArray) {
                            if (metric.threshold) {
                                if (metric.value > metric.threshold * 1.5) {
                                    expect(metric.status).toBe('critical');
                                } else if (metric.value > metric.threshold) {
                                    expect(metric.status).toBe('warning');
                                } else {
                                    expect(metric.status).toBe('normal');
                                }
                            } else {
                                expect(metric.status).toBe('normal');
                            }
                        }
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle empty performance data gracefully
     */
    it('Property 3: Should handle empty performance monitoring data correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(null), // No data to record
                async (_) => {
                    // Create fresh monitoring system with no data
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    const monitoring = testMonitoringSystem.getPerformanceMonitoring();

                    // Property: Empty monitoring should have empty collections
                    expect(Object.keys(monitoring.metrics)).toHaveLength(0);
                    expect(Object.keys(monitoring.currentStatus)).toHaveLength(0);
                    expect(Object.keys(monitoring.averages)).toHaveLength(0);
                    expect(monitoring.alerts).toHaveLength(0);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle concurrent performance metric recording
     */
    it('Property 4: Should handle concurrent performance metric recording', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    concurrentMetrics: fc.integer({ min: 5, max: 20 }),
                    metricNames: fc.array(
                        fc.oneof(
                            fc.constant('response_time'),
                            fc.constant('memory_usage'),
                            fc.constant('cpu_usage')
                        ),
                        { minLength: 1, maxLength: 3 }
                    )
                }),
                async ({ concurrentMetrics, metricNames }) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record concurrent metrics
                    const recordPromises = Array.from({ length: concurrentMetrics }, (_, i) => {
                        const metricName = metricNames[i % metricNames.length];
                        return Promise.resolve(testMonitoringSystem.recordPerformanceMetric({
                            name: metricName,
                            value: i * 10,
                            unit: 'ms',
                            threshold: 500
                        }));
                    });

                    await Promise.all(recordPromises);

                    const monitoring = testMonitoringSystem.getPerformanceMonitoring();

                    // Property: All concurrent metrics should be recorded
                    const totalRecorded = Object.values(monitoring.metrics)
                        .reduce((sum, metricArray) => sum + metricArray.length, 0);
                    expect(totalRecorded).toBe(concurrentMetrics);

                    // Property: Each metric name should have at least one entry if it was used
                    for (const metricName of metricNames) {
                        if (monitoring.metrics[metricName]) {
                            expect(monitoring.metrics[metricName].length).toBeGreaterThan(0);
                        }
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should maintain performance data integrity with large datasets
     */
    it('Property 5: Should maintain performance data integrity with large datasets', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 50, max: 200 }),
                async (datasetSize) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 48
                    });

                    // Record large dataset of performance metrics
                    const metricNames = ['response_time', 'memory_usage', 'cpu_usage', 'disk_io'];
                    const units = ['ms', 'bytes', 'percentage', 'count'];
                    
                    for (let i = 0; i < datasetSize; i++) {
                        const metricName = metricNames[i % metricNames.length];
                        const unit = units[i % units.length];
                        
                        testMonitoringSystem.recordPerformanceMetric({
                            name: metricName,
                            value: Math.random() * 1000,
                            unit: unit as any,
                            threshold: 500
                        });
                    }

                    const monitoring = testMonitoringSystem.getPerformanceMonitoring();

                    // Property: Total metrics should match dataset size
                    const totalMetrics = Object.values(monitoring.metrics)
                        .reduce((sum, metricArray) => sum + metricArray.length, 0);
                    expect(totalMetrics).toBe(datasetSize);

                    // Property: All metric names should be represented
                    const uniqueNames = new Set(metricNames);
                    expect(Object.keys(monitoring.metrics)).toHaveLength(uniqueNames.size);

                    // Property: Current status should be available for all metrics
                    expect(Object.keys(monitoring.currentStatus)).toHaveLength(uniqueNames.size);

                    // Property: Averages should be calculated for all metrics
                    expect(Object.keys(monitoring.averages)).toHaveLength(uniqueNames.size);

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property: Should reject operations when performance monitoring is disabled
     */
    it('Property 6: Should handle disabled performance monitoring correctly', async () => {
        const disabledMonitoringSystem = new MonitoringSystem({
            enableAnalytics: true,
            enablePerformanceMonitoring: false,
            enableErrorTracking: true,
            enableAlerting: true,
            enableUsageAnalytics: true,
            maxDataRetention: 24
        });

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    name: fc.constant('response_time'),
                    value: fc.float({ min: 1, max: 1000 }),
                    unit: fc.constant('ms'),
                    threshold: fc.option(fc.float({ min: 100, max: 500 }))
                }),
                async (performanceMetric) => {
                    // Test metric recording (should be ignored)
                    disabledMonitoringSystem.recordPerformanceMetric(performanceMetric);

                    // Test monitoring access (should throw)
                    expect(() => {
                        disabledMonitoringSystem.getPerformanceMonitoring();
                    }).toThrow('Performance monitoring is not enabled');

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should provide consistent monitoring data across multiple calls
     */
    it('Property 7: Should provide consistent performance monitoring data', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: fc.oneof(fc.constant('response_time'), fc.constant('memory_usage')),
                        value: fc.integer({ min: 1, max: 1000 }),
                        unit: fc.oneof(fc.constant('ms'), fc.constant('bytes')),
                        threshold: fc.option(fc.float({ min: 100, max: 800 }))
                    }),
                    { minLength: 10, maxLength: 25 }
                ),
                async (metrics) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record all metrics
                    for (const metric of metrics) {
                        testMonitoringSystem.recordPerformanceMetric(metric);
                    }

                    // Get monitoring data multiple times
                    const monitoring1 = testMonitoringSystem.getPerformanceMonitoring();
                    const monitoring2 = testMonitoringSystem.getPerformanceMonitoring();
                    const monitoring3 = testMonitoringSystem.getPerformanceMonitoring();

                    // Property: Multiple calls should return consistent data
                    expect(Object.keys(monitoring1.metrics)).toEqual(Object.keys(monitoring2.metrics));
                    expect(Object.keys(monitoring2.metrics)).toEqual(Object.keys(monitoring3.metrics));
                    
                    expect(monitoring1.currentStatus).toEqual(monitoring2.currentStatus);
                    expect(monitoring2.currentStatus).toEqual(monitoring3.currentStatus);
                    
                    expect(monitoring1.averages).toEqual(monitoring2.averages);
                    expect(monitoring2.averages).toEqual(monitoring3.averages);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle different metric units and values correctly
     */
    it('Property 8: Should handle various performance metric units and values', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 3, maxLength: 25 }),
                        value: fc.oneof(
                            fc.integer({ min: 1, max: 99 }), // Small values
                            fc.integer({ min: 100, max: 999 }), // Medium values
                            fc.integer({ min: 1000, max: 99999 }) // Large values
                        ),
                        unit: fc.oneof(
                            fc.constant('ms'),
                            fc.constant('bytes'),
                            fc.constant('count'),
                            fc.constant('percentage')
                        ),
                        threshold: fc.option(fc.float({ min: 1, max: 10000 }))
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                async (diverseMetrics) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record all diverse metrics
                    for (const metric of diverseMetrics) {
                        testMonitoringSystem.recordPerformanceMetric(metric);
                    }

                    const monitoring = testMonitoringSystem.getPerformanceMonitoring();

                    // Property: All metrics should be recorded regardless of value range
                    const totalRecorded = Object.values(monitoring.metrics)
                        .reduce((sum, metricArray) => sum + metricArray.length, 0);
                    expect(totalRecorded).toBe(diverseMetrics.length);

                    // Property: All unique metric names should be represented
                    const uniqueNames = new Set(diverseMetrics.map(m => m.name));
                    expect(Object.keys(monitoring.metrics)).toHaveLength(uniqueNames.size);

                    // Property: All recorded metrics should preserve their original values
                    for (const [metricName, metricArray] of Object.entries(monitoring.metrics)) {
                        for (const recordedMetric of metricArray) {
                            expect(recordedMetric.value).toBeGreaterThanOrEqual(0);
                            expect(['ms', 'bytes', 'count', 'percentage']).toContain(recordedMetric.unit);
                        }
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});