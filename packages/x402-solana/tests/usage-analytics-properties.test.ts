/**
 * Property-Based Tests for Usage Analytics
 * **Feature: synapsepay-enhancements, Property 21: تحليل أنماط الاستخدام**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { 
    MonitoringSystem,
    UsagePattern
} from '../src';

describe('Usage Analytics Properties', () => {
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
     * **Feature: synapsepay-enhancements, Property 21: تحليل أنماط الاستخدام**
     * Property: For any user activity, it should be analyzed and recorded to understand usage patterns
     */
    it('Property 1: Should analyze and record all user activities to understand usage patterns', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        userId: fc.option(fc.string({ minLength: 5, maxLength: 20 })),
                        sessionId: fc.string({ minLength: 10, maxLength: 30 }),
                        actions: fc.array(
                            fc.oneof(
                                fc.constant('login'),
                                fc.constant('payment'),
                                fc.constant('transaction'),
                                fc.constant('logout'),
                                fc.constant('view_dashboard'),
                                fc.constant('create_agent'),
                                fc.constant('control_device'),
                                fc.constant('send_message')
                            ),
                            { minLength: 1, maxLength: 10 }
                        ),
                        duration: fc.integer({ min: 1000, max: 3600000 }), // 1 second to 1 hour in ms
                        deviceInfo: fc.record({
                            platform: fc.oneof(
                                fc.constant('web'),
                                fc.constant('mobile'),
                                fc.constant('desktop'),
                                fc.constant('tablet')
                            ),
                            userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 })),
                            screenSize: fc.option(fc.oneof(
                                fc.constant('small'),
                                fc.constant('medium'),
                                fc.constant('large')
                            ))
                        })
                    }),
                    { minLength: 1, maxLength: 30 }
                ),
                async (usagePatterns) => {
                    // Create fresh monitoring system for this test
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Analyze all usage patterns
                    for (const pattern of usagePatterns) {
                        testMonitoringSystem.analyzeUsagePattern(pattern);
                    }

                    // Get usage analytics
                    const analytics = testMonitoringSystem.getUsageAnalytics();

                    // Property: All sessions should be recorded
                    expect(analytics.totalSessions).toBe(usagePatterns.length);

                    // Property: Average session duration should be calculated correctly
                    const totalDuration = usagePatterns.reduce((sum, p) => sum + p.duration, 0);
                    const expectedAverage = totalDuration / usagePatterns.length;
                    expect(analytics.averageSessionDuration).toBeCloseTo(expectedAverage, 1);

                    // Property: Top actions should be counted correctly
                    const expectedActions: Record<string, number> = {};
                    for (const pattern of usagePatterns) {
                        for (const action of pattern.actions) {
                            expectedActions[action] = (expectedActions[action] || 0) + 1;
                        }
                    }
                    expect(analytics.topActions).toEqual(expectedActions);

                    // Property: Platform distribution should be accurate
                    const expectedPlatforms: Record<string, number> = {};
                    for (const pattern of usagePatterns) {
                        const platform = pattern.deviceInfo.platform;
                        expectedPlatforms[platform] = (expectedPlatforms[platform] || 0) + 1;
                    }
                    expect(analytics.platformDistribution).toEqual(expectedPlatforms);

                    // Property: User patterns should have valid counts
                    expect(analytics.userPatterns.activeUsers).toBeGreaterThanOrEqual(0);
                    expect(analytics.userPatterns.returningUsers).toBeGreaterThanOrEqual(0);
                    expect(analytics.userPatterns.newUsers).toBeGreaterThanOrEqual(0);
                    
                    // Property: Returning + new users should not exceed active users
                    const totalUsers = analytics.userPatterns.returningUsers + analytics.userPatterns.newUsers;
                    expect(totalUsers).toBeLessThanOrEqual(analytics.userPatterns.activeUsers);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Should handle empty usage analytics data gracefully
     */
    it('Property 2: Should handle empty usage analytics data correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(null), // No usage patterns to analyze
                async (_) => {
                    // Create fresh monitoring system with no usage data
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    const analytics = testMonitoringSystem.getUsageAnalytics();

                    // Property: Empty analytics should have zero counts
                    expect(analytics.totalSessions).toBe(0);
                    expect(analytics.averageSessionDuration).toBe(0);
                    expect(Object.keys(analytics.topActions)).toHaveLength(0);
                    expect(Object.keys(analytics.platformDistribution)).toHaveLength(0);
                    expect(analytics.userPatterns.activeUsers).toBe(0);
                    expect(analytics.userPatterns.returningUsers).toBe(0);
                    expect(analytics.userPatterns.newUsers).toBe(0);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle concurrent usage pattern analysis
     */
    it('Property 3: Should handle concurrent usage pattern analysis correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    concurrentPatterns: fc.integer({ min: 5, max: 20 }),
                    platforms: fc.array(
                        fc.oneof(
                            fc.constant('web'),
                            fc.constant('mobile'),
                            fc.constant('desktop')
                        ),
                        { minLength: 1, maxLength: 3 }
                    )
                }),
                async ({ concurrentPatterns, platforms }) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Analyze concurrent usage patterns
                    const analyzePromises = Array.from({ length: concurrentPatterns }, (_, i) => {
                        const platform = platforms[i % platforms.length];
                        return Promise.resolve(testMonitoringSystem.analyzeUsagePattern({
                            sessionId: `session_${i}`,
                            actions: ['login', 'view_dashboard'],
                            duration: (i + 1) * 1000,
                            deviceInfo: { platform }
                        }));
                    });

                    await Promise.all(analyzePromises);

                    const analytics = testMonitoringSystem.getUsageAnalytics();

                    // Property: All concurrent patterns should be analyzed
                    expect(analytics.totalSessions).toBe(concurrentPatterns);

                    // Property: Platform distribution should match expected
                    let totalByPlatform = 0;
                    for (const count of Object.values(analytics.platformDistribution)) {
                        totalByPlatform += count;
                    }
                    expect(totalByPlatform).toBe(concurrentPatterns);

                    // Property: Actions should be counted correctly
                    expect(analytics.topActions['login']).toBe(concurrentPatterns);
                    expect(analytics.topActions['view_dashboard']).toBe(concurrentPatterns);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should maintain usage data integrity with large datasets
     */
    it('Property 4: Should maintain usage data integrity with large datasets', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 50, max: 200 }),
                async (patternCount) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 48
                    });

                    // Analyze large number of usage patterns
                    const platforms = ['web', 'mobile', 'desktop', 'tablet'];
                    const actions = ['login', 'payment', 'transaction', 'logout'];
                    let totalDuration = 0;
                    
                    for (let i = 0; i < patternCount; i++) {
                        const platform = platforms[i % platforms.length];
                        const sessionActions = [actions[i % actions.length]];
                        const duration = (i + 1) * 100;
                        totalDuration += duration;
                        
                        testMonitoringSystem.analyzeUsagePattern({
                            userId: i % 10 === 0 ? `user_${Math.floor(i / 10)}` : undefined,
                            sessionId: `session_${i}`,
                            actions: sessionActions,
                            duration,
                            deviceInfo: { platform }
                        });
                    }

                    const analytics = testMonitoringSystem.getUsageAnalytics();

                    // Property: Total sessions should match pattern count
                    expect(analytics.totalSessions).toBe(patternCount);

                    // Property: Average duration should be calculated correctly
                    const expectedAverage = totalDuration / patternCount;
                    expect(analytics.averageSessionDuration).toBeCloseTo(expectedAverage, 1);

                    // Property: All platforms should be represented
                    const uniquePlatforms = new Set(platforms);
                    expect(Object.keys(analytics.platformDistribution)).toHaveLength(uniquePlatforms.size);

                    // Property: All actions should be represented
                    const uniqueActions = new Set(actions);
                    expect(Object.keys(analytics.topActions)).toHaveLength(uniqueActions.size);

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property: Should handle user tracking correctly
     */
    it('Property 5: Should handle user tracking and identification correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        userId: fc.option(fc.oneof(
                            fc.constant('user1'),
                            fc.constant('user2'),
                            fc.constant('user3'),
                            fc.constant(null)
                        )),
                        sessionId: fc.string({ minLength: 10, maxLength: 25 }),
                        actions: fc.array(fc.constant('action'), { minLength: 1, maxLength: 3 }),
                        duration: fc.integer({ min: 1000, max: 60000 }),
                        deviceInfo: fc.record({
                            platform: fc.constant('web')
                        })
                    }),
                    { minLength: 5, maxLength: 15 }
                ),
                async (usagePatterns) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Analyze all usage patterns
                    for (const pattern of usagePatterns) {
                        testMonitoringSystem.analyzeUsagePattern(pattern);
                    }

                    const analytics = testMonitoringSystem.getUsageAnalytics();

                    // Property: Active users should match unique user IDs (excluding null)
                    const uniqueUserIds = new Set(
                        usagePatterns
                            .map(p => p.userId)
                            .filter(id => id !== null && id !== undefined)
                    );
                    expect(analytics.userPatterns.activeUsers).toBe(uniqueUserIds.size);

                    // Property: User pattern calculations should be consistent (mock calculation)
                    // The monitoring system uses mock calculations for returning/new users
                    // So we just verify they sum to active users
                    const totalCalculatedUsers = analytics.userPatterns.returningUsers + analytics.userPatterns.newUsers;
                    expect(totalCalculatedUsers).toBe(analytics.userPatterns.activeUsers);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should reject operations when usage analytics is disabled
     */
    it('Property 6: Should handle disabled usage analytics correctly', async () => {
        const disabledMonitoringSystem = new MonitoringSystem({
            enableAnalytics: true,
            enablePerformanceMonitoring: true,
            enableErrorTracking: true,
            enableAlerting: true,
            enableUsageAnalytics: false,
            maxDataRetention: 24
        });

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    sessionId: fc.string({ minLength: 10, maxLength: 20 }),
                    actions: fc.array(fc.constant('test_action'), { minLength: 1, maxLength: 3 }),
                    duration: fc.integer({ min: 1000, max: 10000 }),
                    deviceInfo: fc.record({
                        platform: fc.constant('web')
                    })
                }),
                async (usagePattern) => {
                    // Test usage pattern analysis (should be ignored)
                    disabledMonitoringSystem.analyzeUsagePattern(usagePattern);

                    // Test analytics access (should throw)
                    expect(() => {
                        disabledMonitoringSystem.getUsageAnalytics();
                    }).toThrow('Usage analytics is not enabled');

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should provide consistent usage analytics data across multiple calls
     */
    it('Property 7: Should provide consistent usage analytics data', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        sessionId: fc.string({ minLength: 10, maxLength: 20 }),
                        actions: fc.array(
                            fc.oneof(fc.constant('login'), fc.constant('payment')),
                            { minLength: 1, maxLength: 3 }
                        ),
                        duration: fc.integer({ min: 1000, max: 30000 }),
                        deviceInfo: fc.record({
                            platform: fc.oneof(fc.constant('web'), fc.constant('mobile'))
                        })
                    }),
                    { minLength: 8, maxLength: 20 }
                ),
                async (usagePatterns) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Analyze all usage patterns
                    for (const pattern of usagePatterns) {
                        testMonitoringSystem.analyzeUsagePattern(pattern);
                    }

                    // Get analytics data multiple times
                    const analytics1 = testMonitoringSystem.getUsageAnalytics();
                    const analytics2 = testMonitoringSystem.getUsageAnalytics();
                    const analytics3 = testMonitoringSystem.getUsageAnalytics();

                    // Property: Multiple calls should return consistent data
                    expect(analytics1.totalSessions).toBe(analytics2.totalSessions);
                    expect(analytics2.totalSessions).toBe(analytics3.totalSessions);
                    
                    expect(analytics1.averageSessionDuration).toBe(analytics2.averageSessionDuration);
                    expect(analytics2.averageSessionDuration).toBe(analytics3.averageSessionDuration);
                    
                    expect(analytics1.topActions).toEqual(analytics2.topActions);
                    expect(analytics2.topActions).toEqual(analytics3.topActions);
                    
                    expect(analytics1.platformDistribution).toEqual(analytics2.platformDistribution);
                    expect(analytics2.platformDistribution).toEqual(analytics3.platformDistribution);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Should handle different device types and user agents correctly
     */
    it('Property 8: Should handle various device types and user agents', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        sessionId: fc.string({ minLength: 10, maxLength: 30 }),
                        actions: fc.array(
                            fc.oneof(
                                fc.constant('custom_action'),
                                fc.constant('user_click'),
                                fc.constant('page_view'),
                                fc.constant('form_submit'),
                                fc.constant('api_call')
                            ),
                            { minLength: 1, maxLength: 8 }
                        ),
                        duration: fc.integer({ min: 500, max: 120000 }),
                        deviceInfo: fc.record({
                            platform: fc.oneof(
                                fc.constant('web'),
                                fc.constant('mobile'),
                                fc.constant('desktop'),
                                fc.constant('tablet'),
                                fc.constant('smartwatch'),
                                fc.constant('tv')
                            ),
                            userAgent: fc.option(fc.string({ minLength: 20, maxLength: 150 })),
                            screenSize: fc.option(fc.oneof(
                                fc.constant('small'),
                                fc.constant('medium'),
                                fc.constant('large'),
                                fc.constant('xlarge')
                            ))
                        }),
                        userId: fc.option(fc.string({ minLength: 5, maxLength: 25 }))
                    }),
                    { minLength: 1, maxLength: 25 }
                ),
                async (diversePatterns) => {
                    // Create fresh monitoring system
                    const testMonitoringSystem = new MonitoringSystem({
                        enableAnalytics: true,
                        enablePerformanceMonitoring: true,
                        enableErrorTracking: true,
                        enableAlerting: true,
                        enableUsageAnalytics: true,
                        maxDataRetention: 24
                    });

                    // Analyze all diverse patterns
                    for (const pattern of diversePatterns) {
                        testMonitoringSystem.analyzeUsagePattern(pattern);
                    }

                    const analytics = testMonitoringSystem.getUsageAnalytics();

                    // Property: All patterns should be analyzed regardless of diversity
                    expect(analytics.totalSessions).toBe(diversePatterns.length);

                    // Property: All unique platforms should be represented
                    const uniquePlatforms = new Set(diversePatterns.map(p => p.deviceInfo.platform));
                    expect(Object.keys(analytics.platformDistribution)).toHaveLength(uniquePlatforms.size);

                    // Property: All unique actions should be counted
                    const allActions = diversePatterns.flatMap(p => p.actions);
                    const uniqueActions = new Set(allActions);
                    expect(Object.keys(analytics.topActions)).toHaveLength(uniqueActions.size);

                    // Property: Platform distribution should sum to total sessions
                    const totalByPlatform = Object.values(analytics.platformDistribution)
                        .reduce((sum, count) => sum + count, 0);
                    expect(totalByPlatform).toBe(diversePatterns.length);

                    // Property: Action counts should sum to total actions
                    const totalActionCount = Object.values(analytics.topActions)
                        .reduce((sum, count) => sum + count, 0);
                    expect(totalActionCount).toBe(allActions.length);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});