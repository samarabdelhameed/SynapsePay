/**
 * Property-Based Tests for Error Tracking System
 * **Feature: synapsepay-enhancements, Property 19: تتبع الأخطاء**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { 
    MonitoringSystem,
    ErrorEvent
} from '../src';

describe('Error Tracking Properties', () => {
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
     * **Feature: synapsepay-enhancements, Property 19: تتبع الأخطاء**
     * Property: For any error that occurs, it should be recorded and tracked with sufficient details for diagnosis
     */
    it('Property 1: Should record and track all errors with sufficient diagnostic details', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        level: fc.oneof(
                            fc.constant('info'),
                            fc.constant('warning'),
                            fc.constant('error'),
                            fc.constant('critical')
                        ),
                        message: fc.string({ minLength: 5, maxLength: 100 }),
                        stack: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
                        context: fc.record({
                            component: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
                            operation: fc.option(fc.string({ minLength: 3, maxLength: 30 })),
                            userId: fc.option(fc.string({ minLength: 5, maxLength: 20 })),
                            requestId: fc.option(fc.string({ minLength: 10, maxLength: 30 })),
                            errorCode: fc.option(fc.integer({ min: 1000, max: 9999 }))
                        }),
                        userId: fc.option(fc.string({ minLength: 5, maxLength: 20 })),
                        sessionId: fc.option(fc.string({ minLength: 10, maxLength: 30 }))
                    }),
                    { minLength: 1, maxLength: 25 }
                ),
                async (errorEvents) => {
                    // Create fresh monitoring system for this test
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Track all error events
                    const errorIds: string[] = [];
                    for (const errorEvent of errorEvents) {
                        const errorId = testMonitoringSystem.trackError(errorEvent);
                        errorIds.push(errorId);
                    }

                    // Get error tracking data
                    const errorTracking = testMonitoringSystem.getErrorTracking();

                    // Property: All errors should be tracked
                    expect(errorTracking.totalErrors).toBe(errorEvents.length);
                    expect(errorIds).toHaveLength(errorEvents.length);

                    // Property: All error IDs should be unique and non-empty
                    const uniqueIds = new Set(errorIds);
                    expect(uniqueIds.size).toBe(errorEvents.length);
                    for (const id of errorIds) {
                        expect(id).toBeTruthy();
                        expect(typeof id).toBe('string');
                        expect(id.length).toBeGreaterThan(0);
                    }

                    // Property: Errors should be categorized by level correctly
                    const expectedByLevel: Record<string, number> = {};
                    for (const errorEvent of errorEvents) {
                        expectedByLevel[errorEvent.level] = (expectedByLevel[errorEvent.level] || 0) + 1;
                    }
                    expect(errorTracking.errorsByLevel).toEqual(expectedByLevel);

                    // Property: Recent errors should contain the latest entries
                    expect(errorTracking.recentErrors.length).toBeLessThanOrEqual(20);
                    if (errorEvents.length <= 20) {
                        expect(errorTracking.recentErrors.length).toBe(errorEvents.length);
                    }

                    // Property: All tracked errors should have required fields
                    for (const trackedError of errorTracking.recentErrors) {
                        expect(trackedError.id).toBeTruthy();
                        expect(trackedError.timestamp).toBeGreaterThan(0);
                        expect(['info', 'warning', 'error', 'critical']).toContain(trackedError.level);
                        expect(trackedError.message).toBeTruthy();
                        expect(typeof trackedError.context).toBe('object');
                        expect(typeof trackedError.resolved).toBe('boolean');
                    }

                    // Property: Unresolved errors should initially be all errors
                    expect(errorTracking.unresolvedErrors.length).toBe(errorEvents.length);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle empty error tracking data gracefully
     */
    it('Property 2: Should handle empty error tracking data correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(null), // No errors to track
                async (_) => {
                    // Create fresh monitoring system with no errors
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    const errorTracking = testMonitoringSystem.getErrorTracking();

                    // Property: Empty error tracking should have zero counts
                    expect(errorTracking.totalErrors).toBe(0);
                    expect(Object.keys(errorTracking.errorsByLevel)).toHaveLength(0);
                    expect(errorTracking.recentErrors).toHaveLength(0);
                    expect(errorTracking.unresolvedErrors).toHaveLength(0);
                    expect(Object.keys(errorTracking.errorTrends)).toHaveLength(0);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle concurrent error tracking
     */
    it('Property 3: Should handle concurrent error tracking correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    concurrentErrors: fc.integer({ min: 5, max: 20 }),
                    errorLevels: fc.array(
                        fc.oneof(
                            fc.constant('info'),
                            fc.constant('warning'),
                            fc.constant('error'),
                            fc.constant('critical')
                        ),
                        { minLength: 1, maxLength: 4 }
                    )
                }),
                async ({ concurrentErrors, errorLevels }) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Track concurrent errors
                    const trackPromises = Array.from({ length: concurrentErrors }, (_, i) => {
                        const errorLevel = errorLevels[i % errorLevels.length];
                        return Promise.resolve(testMonitoringSystem.trackError({
                            level: errorLevel as any,
                            message: `Concurrent error ${i}`,
                            context: { index: i, concurrent: true }
                        }));
                    });

                    const errorIds = await Promise.all(trackPromises);

                    const errorTracking = testMonitoringSystem.getErrorTracking();

                    // Property: All concurrent errors should be tracked
                    expect(errorTracking.totalErrors).toBe(concurrentErrors);
                    expect(errorIds).toHaveLength(concurrentErrors);

                    // Property: All error IDs should be unique
                    const uniqueIds = new Set(errorIds);
                    expect(uniqueIds.size).toBe(concurrentErrors);

                    // Property: Error level distribution should match expected
                    let totalByLevel = 0;
                    for (const count of Object.values(errorTracking.errorsByLevel)) {
                        totalByLevel += count;
                    }
                    expect(totalByLevel).toBe(concurrentErrors);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should maintain error data integrity with large datasets
     */
    it('Property 4: Should maintain error data integrity with large datasets', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 50, max: 150 }),
                async (errorCount) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 48
                    });

                    // Track large number of errors
                    const levels = ['info', 'warning', 'error', 'critical'];
                    const errorIds: string[] = [];
                    
                    for (let i = 0; i < errorCount; i++) {
                        const level = levels[i % levels.length];
                        const errorId = testMonitoringSystem.trackError({
                            level: level as any,
                            message: `Error ${i}: ${level} level`,
                            context: { batch: Math.floor(i / 10), index: i },
                            stack: i % 5 === 0 ? `Stack trace for error ${i}` : undefined
                        });
                        errorIds.push(errorId);
                    }

                    const errorTracking = testMonitoringSystem.getErrorTracking();

                    // Property: Total count should match error count
                    expect(errorTracking.totalErrors).toBe(errorCount);

                    // Property: All levels should be represented
                    const totalByLevel = Object.values(errorTracking.errorsByLevel)
                        .reduce((sum, count) => sum + count, 0);
                    expect(totalByLevel).toBe(errorCount);

                    // Property: Recent errors should be limited to 20
                    expect(errorTracking.recentErrors.length).toBeLessThanOrEqual(20);

                    // Property: All errors should initially be unresolved
                    expect(errorTracking.unresolvedErrors.length).toBe(errorCount);

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property: Should handle error resolution correctly
     */
    it('Property 5: Should handle error resolution correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        level: fc.oneof(fc.constant('warning'), fc.constant('error')),
                        message: fc.string({ minLength: 5, maxLength: 50 }),
                        context: fc.object(),
                        shouldResolve: fc.boolean()
                    }),
                    { minLength: 5, maxLength: 15 }
                ),
                async (errorEvents) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Track errors and collect IDs
                    const errorIds: string[] = [];
                    for (const errorEvent of errorEvents) {
                        const errorId = testMonitoringSystem.trackError(errorEvent);
                        errorIds.push(errorId);
                    }

                    // Resolve some errors based on shouldResolve flag
                    const resolvedIds: string[] = [];
                    for (let i = 0; i < errorEvents.length; i++) {
                        if (errorEvents[i].shouldResolve) {
                            const resolved = testMonitoringSystem.resolveError(errorIds[i]);
                            expect(resolved).toBe(true);
                            resolvedIds.push(errorIds[i]);
                        }
                    }

                    const errorTracking = testMonitoringSystem.getErrorTracking();

                    // Property: Total errors should remain the same
                    expect(errorTracking.totalErrors).toBe(errorEvents.length);

                    // Property: Unresolved errors should exclude resolved ones
                    const expectedUnresolved = errorEvents.length - resolvedIds.length;
                    expect(errorTracking.unresolvedErrors.length).toBe(expectedUnresolved);

                    // Property: Resolved errors should not appear in unresolved list
                    const unresolvedIds = errorTracking.unresolvedErrors.map(e => e.id);
                    for (const resolvedId of resolvedIds) {
                        expect(unresolvedIds).not.toContain(resolvedId);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should reject operations when error tracking is disabled
     */
    it('Property 6: Should handle disabled error tracking correctly', async () => {
        const disabledMonitoringSystem = new MonitoringSystem({
            enableAnalytics: true,
            enablePerformanceMonitoring: true,
            enableErrorTracking: false,
            enableAlerting: true,
            enableUsageAnalytics: true,
            maxDataRetention: 24
        });

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    level: fc.oneof(fc.constant('error'), fc.constant('warning')),
                    message: fc.string({ minLength: 5, maxLength: 50 }),
                    context: fc.object()
                }),
                async (errorEvent) => {
                    // Test error tracking (should return empty string)
                    const errorId = disabledMonitoringSystem.trackError(errorEvent);
                    expect(errorId).toBe('');

                    // Test error tracking access (should throw)
                    expect(() => {
                        disabledMonitoringSystem.getErrorTracking();
                    }).toThrow('Error tracking is not enabled');

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should provide consistent error tracking data across multiple calls
     */
    it('Property 7: Should provide consistent error tracking data', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        level: fc.oneof(fc.constant('info'), fc.constant('error')),
                        message: fc.string({ minLength: 5, maxLength: 50 }),
                        context: fc.object()
                    }),
                    { minLength: 8, maxLength: 20 }
                ),
                async (errorEvents) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Track all errors
                    for (const errorEvent of errorEvents) {
                        testMonitoringSystem.trackError(errorEvent);
                    }

                    // Get error tracking data multiple times
                    const tracking1 = testMonitoringSystem.getErrorTracking();
                    const tracking2 = testMonitoringSystem.getErrorTracking();
                    const tracking3 = testMonitoringSystem.getErrorTracking();

                    // Property: Multiple calls should return consistent data
                    expect(tracking1.totalErrors).toBe(tracking2.totalErrors);
                    expect(tracking2.totalErrors).toBe(tracking3.totalErrors);
                    
                    expect(tracking1.errorsByLevel).toEqual(tracking2.errorsByLevel);
                    expect(tracking2.errorsByLevel).toEqual(tracking3.errorsByLevel);
                    
                    expect(tracking1.unresolvedErrors.length).toBe(tracking2.unresolvedErrors.length);
                    expect(tracking2.unresolvedErrors.length).toBe(tracking3.unresolvedErrors.length);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle different error types and contexts correctly
     */
    it('Property 8: Should handle various error types and contexts', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        level: fc.oneof(
                            fc.constant('info'),
                            fc.constant('warning'),
                            fc.constant('error'),
                            fc.constant('critical')
                        ),
                        message: fc.string({ minLength: 1, maxLength: 200 }),
                        stack: fc.option(fc.string({ minLength: 10, maxLength: 1000 })),
                        context: fc.record({
                            stringField: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
                            numberField: fc.option(fc.integer({ min: -1000, max: 1000 })),
                            booleanField: fc.option(fc.boolean()),
                            arrayField: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 5 })),
                            nestedObject: fc.option(fc.record({
                                nested: fc.string({ minLength: 1, maxLength: 20 })
                            }))
                        }),
                        userId: fc.option(fc.string({ minLength: 5, maxLength: 30 })),
                        sessionId: fc.option(fc.string({ minLength: 10, maxLength: 40 }))
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                async (complexErrors) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Track all complex errors
                    const errorIds: string[] = [];
                    for (const errorEvent of complexErrors) {
                        const errorId = testMonitoringSystem.trackError(errorEvent);
                        errorIds.push(errorId);
                    }

                    const errorTracking = testMonitoringSystem.getErrorTracking();

                    // Property: All errors should be tracked regardless of complexity
                    expect(errorTracking.totalErrors).toBe(complexErrors.length);
                    expect(errorIds).toHaveLength(complexErrors.length);

                    // Property: All unique levels should be represented
                    const uniqueLevels = new Set(complexErrors.map(e => e.level));
                    expect(Object.keys(errorTracking.errorsByLevel)).toHaveLength(uniqueLevels.size);

                    // Property: Recent errors should preserve context structure
                    for (const recentError of errorTracking.recentErrors) {
                        expect(typeof recentError.context).toBe('object');
                        expect(recentError.timestamp).toBeGreaterThan(0);
                        expect(recentError.id).toBeTruthy();
                    }

                    // Property: Error trends should have valid structure
                    expect(typeof errorTracking.errorTrends).toBe('object');
                    for (const count of Object.values(errorTracking.errorTrends)) {
                        expect(count).toBeGreaterThanOrEqual(0);
                        expect(Number.isInteger(count)).toBe(true);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});