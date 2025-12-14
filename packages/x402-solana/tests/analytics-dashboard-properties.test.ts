/**
 * Property-Based Tests for Analytics Dashboard
 * **Feature: synapsepay-enhancements, Property 17: عرض الإحصائيات**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { 
    MonitoringSystem,
    AnalyticsData
} from '../src';

describe('Analytics Dashboard Properties', () => {
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
     * **Feature: synapsepay-enhancements, Property 17: عرض الإحصائيات**
     * Property: For any data in the system, it should appear in the dashboard correctly and updated
     */
    it('Property 1: Should display all recorded analytics data correctly in dashboard', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        type: fc.oneof(
                            fc.constant('payment'),
                            fc.constant('transaction'),
                            fc.constant('user_action'),
                            fc.constant('system_event'),
                            fc.constant('error')
                        ),
                        category: fc.oneof(
                            fc.constant('financial'),
                            fc.constant('user_interaction'),
                            fc.constant('system'),
                            fc.constant('security'),
                            fc.constant('performance')
                        ),
                        value: fc.float({ min: 0, max: 10000 }),
                        metadata: fc.record({
                            source: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
                            version: fc.option(fc.string({ minLength: 3, maxLength: 10 })),
                            environment: fc.option(fc.oneof(fc.constant('dev'), fc.constant('staging'), fc.constant('prod')))
                        }),
                        userId: fc.option(fc.string({ minLength: 5, maxLength: 20 })),
                        sessionId: fc.option(fc.string({ minLength: 10, maxLength: 30 }))
                    }),
                    { minLength: 1, maxLength: 50 }
                ),
                async (analyticsEntries) => {
                    // Create fresh monitoring system for this test
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record all analytics data
                    for (const entry of analyticsEntries) {
                        testMonitoringSystem.recordAnalytics(entry);
                    }

                    // Get dashboard data
                    const dashboard = testMonitoringSystem.getAnalyticsDashboard();

                    // Property: Total events should match recorded entries
                    expect(dashboard.totalEvents).toBe(analyticsEntries.length);

                    // Property: Events by type should be correctly categorized
                    const expectedByType: Record<string, number> = {};
                    for (const entry of analyticsEntries) {
                        expectedByType[entry.type] = (expectedByType[entry.type] || 0) + 1;
                    }
                    expect(dashboard.eventsByType).toEqual(expectedByType);

                    // Property: Events by category should be correctly categorized
                    const expectedByCategory: Record<string, number> = {};
                    for (const entry of analyticsEntries) {
                        expectedByCategory[entry.category] = (expectedByCategory[entry.category] || 0) + 1;
                    }
                    expect(dashboard.eventsByCategory).toEqual(expectedByCategory);

                    // Property: Recent events should contain the latest entries
                    expect(dashboard.recentEvents.length).toBeLessThanOrEqual(50);
                    if (analyticsEntries.length <= 50) {
                        expect(dashboard.recentEvents.length).toBe(analyticsEntries.length);
                    }

                    // Property: All recent events should have timestamps
                    for (const recentEvent of dashboard.recentEvents) {
                        expect(recentEvent.timestamp).toBeGreaterThan(0);
                        expect(typeof recentEvent.timestamp).toBe('number');
                    }

                    // Property: Trends should contain valid data
                    expect(typeof dashboard.trends.hourly).toBe('object');
                    expect(typeof dashboard.trends.daily).toBe('object');

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle empty analytics data gracefully
     */
    it('Property 2: Should handle empty analytics data correctly', async () => {
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

                    const dashboard = testMonitoringSystem.getAnalyticsDashboard();

                    // Property: Empty dashboard should have zero counts
                    expect(dashboard.totalEvents).toBe(0);
                    expect(Object.keys(dashboard.eventsByType)).toHaveLength(0);
                    expect(Object.keys(dashboard.eventsByCategory)).toHaveLength(0);
                    expect(dashboard.recentEvents).toHaveLength(0);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should correctly aggregate data by time periods
     */
    it('Property 3: Should correctly aggregate analytics data by time periods', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    entries: fc.array(
                        fc.record({
                            type: fc.oneof(fc.constant('payment'), fc.constant('transaction')),
                            category: fc.constant('financial'),
                            value: fc.float({ min: 1, max: 1000 }),
                            metadata: fc.object()
                        }),
                        { minLength: 5, maxLength: 20 }
                    ),
                    timeSpread: fc.integer({ min: 1, max: 24 }) // hours
                }),
                async ({ entries, timeSpread }) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 48
                    });

                    // Record entries with different timestamps
                    const now = Date.now();
                    const hourMs = 60 * 60 * 1000;
                    
                    for (let i = 0; i < entries.length; i++) {
                        const entry = entries[i];
                        // Manually set timestamp to spread across time
                        const timestampOffset = (i / entries.length) * timeSpread * hourMs;
                        
                        // Record the entry
                        testMonitoringSystem.recordAnalytics(entry);
                    }

                    const dashboard = testMonitoringSystem.getAnalyticsDashboard();

                    // Property: Total should match all entries
                    expect(dashboard.totalEvents).toBe(entries.length);

                    // Property: Trends should have valid structure
                    expect(typeof dashboard.trends.hourly).toBe('object');
                    expect(typeof dashboard.trends.daily).toBe('object');

                    // Property: All trend values should be positive integers
                    for (const count of Object.values(dashboard.trends.hourly)) {
                        expect(count).toBeGreaterThanOrEqual(0);
                        expect(Number.isInteger(count)).toBe(true);
                    }

                    for (const count of Object.values(dashboard.trends.daily)) {
                        expect(count).toBeGreaterThanOrEqual(0);
                        expect(Number.isInteger(count)).toBe(true);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle concurrent analytics recording
     */
    it('Property 4: Should handle concurrent analytics data recording', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    concurrentEntries: fc.integer({ min: 5, max: 20 }),
                    entryTypes: fc.array(
                        fc.oneof(
                            fc.constant('payment'),
                            fc.constant('transaction'),
                            fc.constant('user_action')
                        ),
                        { minLength: 1, maxLength: 3 }
                    )
                }),
                async ({ concurrentEntries, entryTypes }) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record concurrent entries
                    const recordPromises = Array.from({ length: concurrentEntries }, (_, i) => {
                        const entryType = entryTypes[i % entryTypes.length];
                        return Promise.resolve(testMonitoringSystem.recordAnalytics({
                            type: entryType,
                            category: 'concurrent_test',
                            value: i,
                            metadata: { index: i }
                        }));
                    });

                    await Promise.all(recordPromises);

                    const dashboard = testMonitoringSystem.getAnalyticsDashboard();

                    // Property: All concurrent entries should be recorded
                    expect(dashboard.totalEvents).toBe(concurrentEntries);

                    // Property: Category should show all concurrent entries
                    expect(dashboard.eventsByCategory['concurrent_test']).toBe(concurrentEntries);

                    // Property: Type distribution should match expected
                    const totalTypeCount = Object.values(dashboard.eventsByType)
                        .reduce((sum, count) => sum + count, 0);
                    expect(totalTypeCount).toBe(concurrentEntries);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should maintain data integrity with large datasets
     */
    it('Property 5: Should maintain data integrity with large analytics datasets', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 100, max: 500 }),
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

                    // Record large dataset
                    const types = ['payment', 'transaction', 'user_action', 'system_event'];
                    const categories = ['financial', 'user_interaction', 'system'];
                    
                    for (let i = 0; i < datasetSize; i++) {
                        testMonitoringSystem.recordAnalytics({
                            type: types[i % types.length] as any,
                            category: categories[i % categories.length],
                            value: i,
                            metadata: { batch: Math.floor(i / 10) }
                        });
                    }

                    const dashboard = testMonitoringSystem.getAnalyticsDashboard();

                    // Property: Total count should match dataset size
                    expect(dashboard.totalEvents).toBe(datasetSize);

                    // Property: All types should be represented
                    const totalByType = Object.values(dashboard.eventsByType)
                        .reduce((sum, count) => sum + count, 0);
                    expect(totalByType).toBe(datasetSize);

                    // Property: All categories should be represented
                    const totalByCategory = Object.values(dashboard.eventsByCategory)
                        .reduce((sum, count) => sum + count, 0);
                    expect(totalByCategory).toBe(datasetSize);

                    // Property: Recent events should be limited to 50
                    expect(dashboard.recentEvents.length).toBeLessThanOrEqual(50);

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property: Should reject operations when analytics is disabled
     */
    it('Property 6: Should handle disabled analytics correctly', async () => {
        const disabledMonitoringSystem = new MonitoringSystem({
            enableAnalytics: false,
            enablePerformanceMonitoring: true,
            enableErrorTracking: true,
            enableAlerting: true,
            enableUsageAnalytics: true,
            maxDataRetention: 24
        });

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    type: fc.oneof(fc.constant('payment'), fc.constant('transaction')),
                    category: fc.constant('test'),
                    value: fc.float({ min: 1, max: 100 }),
                    metadata: fc.object()
                }),
                async (analyticsEntry) => {
                    // Test analytics recording (should be ignored)
                    disabledMonitoringSystem.recordAnalytics(analyticsEntry);

                    // Test dashboard access (should throw)
                    expect(() => {
                        disabledMonitoringSystem.getAnalyticsDashboard();
                    }).toThrow('Analytics is not enabled');

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should provide consistent dashboard data across multiple calls
     */
    it('Property 7: Should provide consistent analytics dashboard data', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        type: fc.oneof(fc.constant('payment'), fc.constant('user_action')),
                        category: fc.oneof(fc.constant('financial'), fc.constant('user_interaction')),
                        value: fc.float({ min: 1, max: 1000 }),
                        metadata: fc.object()
                    }),
                    { minLength: 10, maxLength: 30 }
                ),
                async (entries) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record all entries
                    for (const entry of entries) {
                        testMonitoringSystem.recordAnalytics(entry);
                    }

                    // Get dashboard data multiple times
                    const dashboard1 = testMonitoringSystem.getAnalyticsDashboard();
                    const dashboard2 = testMonitoringSystem.getAnalyticsDashboard();
                    const dashboard3 = testMonitoringSystem.getAnalyticsDashboard();

                    // Property: Multiple calls should return consistent data
                    expect(dashboard1.totalEvents).toBe(dashboard2.totalEvents);
                    expect(dashboard2.totalEvents).toBe(dashboard3.totalEvents);
                    
                    expect(dashboard1.eventsByType).toEqual(dashboard2.eventsByType);
                    expect(dashboard2.eventsByType).toEqual(dashboard3.eventsByType);
                    
                    expect(dashboard1.eventsByCategory).toEqual(dashboard2.eventsByCategory);
                    expect(dashboard2.eventsByCategory).toEqual(dashboard3.eventsByCategory);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle different data types and metadata correctly
     */
    it('Property 8: Should handle various analytics data types and metadata', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        type: fc.oneof(
                            fc.constant('payment'),
                            fc.constant('transaction'),
                            fc.constant('user_action'),
                            fc.constant('system_event'),
                            fc.constant('error')
                        ),
                        category: fc.string({ minLength: 3, maxLength: 20 }),
                        value: fc.oneof(
                            fc.float({ min: 0, max: 1000000 }),
                            fc.integer({ min: 0, max: 1000000 })
                        ),
                        metadata: fc.record({
                            stringField: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
                            numberField: fc.option(fc.float({ min: -1000, max: 1000 })),
                            booleanField: fc.option(fc.boolean()),
                            arrayField: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 5 })),
                            nestedObject: fc.option(fc.record({
                                nested: fc.string({ minLength: 1, maxLength: 20 })
                            }))
                        }),
                        userId: fc.option(fc.string({ minLength: 5, maxLength: 30 })),
                        sessionId: fc.option(fc.string({ minLength: 10, maxLength: 40 }))
                    }),
                    { minLength: 1, maxLength: 25 }
                ),
                async (complexEntries) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Record all complex entries
                    for (const entry of complexEntries) {
                        testMonitoringSystem.recordAnalytics(entry);
                    }

                    const dashboard = testMonitoringSystem.getAnalyticsDashboard();

                    // Property: All entries should be recorded regardless of complexity
                    expect(dashboard.totalEvents).toBe(complexEntries.length);

                    // Property: All unique types should be represented
                    const uniqueTypes = new Set(complexEntries.map(e => e.type));
                    expect(Object.keys(dashboard.eventsByType)).toHaveLength(uniqueTypes.size);

                    // Property: All unique categories should be represented
                    const uniqueCategories = new Set(complexEntries.map(e => e.category));
                    expect(Object.keys(dashboard.eventsByCategory)).toHaveLength(uniqueCategories.size);

                    // Property: Recent events should preserve metadata structure
                    for (const recentEvent of dashboard.recentEvents) {
                        expect(typeof recentEvent.metadata).toBe('object');
                        expect(recentEvent.timestamp).toBeGreaterThan(0);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});