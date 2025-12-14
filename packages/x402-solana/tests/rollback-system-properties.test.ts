/**
 * Property-Based Tests for Rollback System
 * **Feature: synapsepay-enhancements, Property 30: التراجع عن النشر**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { 
    EnvironmentManager,
    DeploymentRecord,
    RollbackInfo,
    Environment
} from '../src/deployment-system';

describe('Rollback System Properties', () => {
    let deploymentSystem: EnvironmentManager;

    beforeEach(() => {
        deploymentSystem = new EnvironmentManager();
        
        // Set up test environments
        const testEnvironments = [
            {
                name: 'staging',
                type: 'staging' as const,
                config: {
                    solanaNetwork: 'devnet',
                    rpcUrl: 'https://api.devnet.solana.com',
                    wsUrl: 'wss://api.devnet.solana.com',
                    programIds: {
                        registry: 'STAGING_REGISTRY_ID',
                        payments: 'STAGING_PAYMENTS_ID',
                        scheduler: 'STAGING_SCHEDULER_ID'
                    },
                    features: {
                        gasless: true,
                        robotControl: true,
                        iotDevice: true,
                        monitoring: true
                    },
                    security: {
                        rateLimiting: true,
                        emergencyPause: true,
                        multiSig: true
                    },
                    resources: {
                        maxConcurrentUsers: 1000,
                        maxTransactionsPerSecond: 500,
                        storageLimit: 1024 * 1024 * 1024 // 1GB
                    }
                },
                status: 'active' as const
            },
            {
                name: 'production',
                type: 'production' as const,
                config: {
                    solanaNetwork: 'mainnet-beta',
                    rpcUrl: 'https://api.mainnet-beta.solana.com',
                    wsUrl: 'wss://api.mainnet-beta.solana.com',
                    programIds: {
                        registry: 'PROD_REGISTRY_ID',
                        payments: 'PROD_PAYMENTS_ID',
                        scheduler: 'PROD_SCHEDULER_ID'
                    },
                    features: {
                        gasless: true,
                        robotControl: true,
                        iotDevice: true,
                        monitoring: true
                    },
                    security: {
                        rateLimiting: true,
                        emergencyPause: true,
                        multiSig: true
                    },
                    resources: {
                        maxConcurrentUsers: 10000,
                        maxTransactionsPerSecond: 5000,
                        storageLimit: 1024 * 1024 * 1024 * 10 // 10GB
                    }
                },
                status: 'active' as const
            }
        ];

        testEnvironments.forEach(env => {
            deploymentSystem.createEnvironment(env);
        });
    });

    /**
     * **Feature: synapsepay-enhancements, Property 30: التراجع عن النشر**
     * Property: For any deployment that fails or causes issues, 
     * the system should be able to rollback to the previous working version
     */
    it('Property 30.1: Rollback should restore previous working version when deployment fails', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    environment: fc.constantFrom('staging', 'production'),
                    versions: fc.array(
                        fc.string({ minLength: 5, maxLength: 15 }).filter(s => /^v\d+\.\d+\.\d+$/.test(s)),
                        { minLength: 2, maxLength: 4 }
                    ),
                    rollbackReason: fc.constantFrom(
                        'deployment_failed', 
                        'performance_degradation', 
                        'critical_bug', 
                        'security_issue',
                        'user_reported_issues'
                    )
                }),
                async (rollbackData) => {
                    const environment = rollbackData.environment;
                    const versions = rollbackData.versions;
                    
                    // Create initial successful deployment
                    const initialDeployment: DeploymentRecord = {
                        id: `deploy_${Date.now()}_initial`,
                        timestamp: Date.now() - 3600000, // 1 hour ago
                        version: versions[0],
                        environment,
                        status: 'success',
                        duration: 300000, // 5 minutes
                        artifacts: [
                            {
                                type: 'program',
                                name: 'synapsepay-registry',
                                path: `/deployments/${versions[0]}/registry.so`,
                                hash: 'abc123def456',
                                size: 1024 * 1024 // 1MB
                            }
                        ],
                        tests: [
                            {
                                suite: 'Integration Tests',
                                name: 'deployment_verification',
                                status: 'passed',
                                duration: 30000
                            }
                        ]
                    };

                    // Simulate initial deployment
                    deploymentSystem['deploymentHistory'].push(initialDeployment);
                    const env = deploymentSystem.getEnvironment(environment)!;
                    env.lastDeployment = initialDeployment;

                    // Create failed deployment
                    const failedDeployment: DeploymentRecord = {
                        id: `deploy_${Date.now()}_failed`,
                        timestamp: Date.now(),
                        version: versions[1] || 'v2.0.0',
                        environment,
                        status: 'failed',
                        duration: 180000, // 3 minutes before failure
                        artifacts: [],
                        tests: [
                            {
                                suite: 'Integration Tests',
                                name: 'deployment_verification',
                                status: 'failed',
                                duration: 15000,
                                error: 'Deployment verification failed'
                            }
                        ]
                    };

                    // Simulate failed deployment
                    deploymentSystem['deploymentHistory'].push(failedDeployment);
                    env.lastDeployment = failedDeployment;
                    env.status = 'failed';

                    // Perform rollback
                    const rollbackResult = await deploymentSystem.rollbackDeployment(
                        environment,
                        rollbackData.rollbackReason
                    );

                    // Verify rollback was successful
                    expect(rollbackResult).toBeDefined();
                    expect(rollbackResult.success).toBe(true);
                    expect(rollbackResult.rolledBackTo).toBe(versions[0]);
                    expect(rollbackResult.rollbackReason).toBe(rollbackData.rollbackReason);

                    // Verify environment was restored
                    const restoredEnv = deploymentSystem.getEnvironment(environment)!;
                    expect(restoredEnv.status).toBe('active');
                    expect(restoredEnv.lastDeployment).toBeDefined();
                    expect(restoredEnv.lastDeployment!.status).toBe('rolled_back');

                    // Verify rollback info was recorded
                    expect(restoredEnv.lastDeployment!.rollbackInfo).toBeDefined();
                    expect(restoredEnv.lastDeployment!.rollbackInfo!.previousVersion).toBe(versions[0]);
                    expect(restoredEnv.lastDeployment!.rollbackInfo!.rollbackReason).toBe(rollbackData.rollbackReason);

                    return true;
                }
            ),
            { numRuns: 8 }
        );
    });

    /**
     * Property: Rollback should maintain deployment history integrity
     */
    it('Property 30.2: Rollback should preserve deployment history and add rollback records', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    environment: fc.constantFrom('staging', 'production'),
                    deploymentCount: fc.integer({ min: 3, max: 6 }),
                    rollbackTarget: fc.integer({ min: 0, max: 2 }) // Index of version to rollback to
                }),
                async (historyData) => {
                    const environment = historyData.environment;
                    const deploymentCount = historyData.deploymentCount;
                    
                    // Create multiple deployments
                    const deployments: DeploymentRecord[] = [];
                    for (let i = 0; i < deploymentCount; i++) {
                        const deployment: DeploymentRecord = {
                            id: `deploy_${Date.now()}_${i}`,
                            timestamp: Date.now() - (deploymentCount - i) * 600000, // 10 minutes apart
                            version: `v1.${i}.0`,
                            environment,
                            status: 'success',
                            duration: 300000,
                            artifacts: [
                                {
                                    type: 'program',
                                    name: 'synapsepay-registry',
                                    path: `/deployments/v1.${i}.0/registry.so`,
                                    hash: `hash_${i}`,
                                    size: 1024 * 1024
                                }
                            ],
                            tests: [
                                {
                                    suite: 'Integration Tests',
                                    name: 'deployment_verification',
                                    status: 'passed',
                                    duration: 30000
                                }
                            ]
                        };
                        deployments.push(deployment);
                        deploymentSystem['deploymentHistory'].push(deployment);
                    }

                    // Set current deployment
                    const env = deploymentSystem.getEnvironment(environment)!;
                    env.lastDeployment = deployments[deployments.length - 1];

                    // Get initial history length
                    const initialHistoryLength = deploymentSystem.getDeploymentHistory().length;

                    // Perform rollback to target version
                    const targetVersion = deployments[historyData.rollbackTarget].version;
                    const rollbackResult = await deploymentSystem.rollbackDeployment(
                        environment,
                        'manual_rollback'
                    );

                    // Verify rollback was successful
                    expect(rollbackResult).toBeDefined();
                    expect(rollbackResult.success).toBe(true);

                    // Verify history was preserved and extended
                    const finalHistory = deploymentSystem.getDeploymentHistory();
                    expect(finalHistory.length).toBeGreaterThan(initialHistoryLength);

                    // Verify all original deployments are still in history
                    deployments.forEach(originalDeployment => {
                        const found = finalHistory.find(h => h.id === originalDeployment.id);
                        expect(found).toBeDefined();
                        expect(found!.version).toBe(originalDeployment.version);
                        expect(found!.status).toBe(originalDeployment.status);
                    });

                    // Verify rollback record was added
                    const rollbackRecords = finalHistory.filter(h => h.status === 'rolled_back');
                    expect(rollbackRecords.length).toBeGreaterThan(0);

                    const latestRollback = rollbackRecords[rollbackRecords.length - 1];
                    expect(latestRollback.rollbackInfo).toBeDefined();
                    expect(latestRollback.rollbackInfo!.rollbackReason).toBe('manual_rollback');

                    return true;
                }
            ),
            { numRuns: 6 }
        );
    });

    /**
     * Property: Rollback should handle edge cases correctly
     */
    it('Property 30.3: Rollback should handle edge cases like no previous deployments', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    environment: fc.constantFrom('staging', 'production'),
                    scenario: fc.constantFrom('no_previous_deployment', 'single_deployment', 'all_failed_deployments')
                }),
                async (edgeCaseData) => {
                    const environment = edgeCaseData.environment;
                    const env = deploymentSystem.getEnvironment(environment)!;

                    switch (edgeCaseData.scenario) {
                        case 'no_previous_deployment':
                            // No deployments exist
                            env.lastDeployment = undefined;
                            break;

                        case 'single_deployment':
                            // Only one deployment exists (current)
                            const singleDeployment: DeploymentRecord = {
                                id: `deploy_single_${Date.now()}`,
                                timestamp: Date.now(),
                                version: 'v1.0.0',
                                environment,
                                status: 'failed',
                                duration: 180000,
                                artifacts: [],
                                tests: []
                            };
                            deploymentSystem['deploymentHistory'].push(singleDeployment);
                            env.lastDeployment = singleDeployment;
                            break;

                        case 'all_failed_deployments':
                            // All previous deployments failed
                            const failedDeployments = [
                                {
                                    id: `deploy_failed_1_${Date.now()}`,
                                    timestamp: Date.now() - 1200000,
                                    version: 'v1.0.0',
                                    environment,
                                    status: 'failed' as const,
                                    duration: 180000,
                                    artifacts: [],
                                    tests: []
                                },
                                {
                                    id: `deploy_failed_2_${Date.now()}`,
                                    timestamp: Date.now() - 600000,
                                    version: 'v1.1.0',
                                    environment,
                                    status: 'failed' as const,
                                    duration: 180000,
                                    artifacts: [],
                                    tests: []
                                }
                            ];
                            failedDeployments.forEach(d => deploymentSystem['deploymentHistory'].push(d));
                            env.lastDeployment = failedDeployments[1];
                            break;
                    }

                    // Attempt rollback
                    try {
                        const rollbackResult = await deploymentSystem.rollbackDeployment(
                            environment,
                            'edge_case_test'
                        );

                        if (edgeCaseData.scenario === 'no_previous_deployment' || 
                            edgeCaseData.scenario === 'single_deployment' ||
                            edgeCaseData.scenario === 'all_failed_deployments') {
                            // These scenarios should either fail gracefully or handle appropriately
                            expect(rollbackResult).toBeDefined();
                            
                            if (rollbackResult.success === false) {
                                // Failed rollback should have clear error message
                                expect(rollbackResult.error).toBeDefined();
                                expect(rollbackResult.error).toContain('rollback');
                            }
                        }
                    } catch (error) {
                        // Edge cases may throw errors - this is acceptable
                        expect(error).toBeDefined();
                        expect(error.message).toBeDefined();
                    }

                    // Environment should remain in a consistent state
                    const finalEnv = deploymentSystem.getEnvironment(environment)!;
                    expect(finalEnv).toBeDefined();
                    expect(['active', 'failed', 'inactive']).toContain(finalEnv.status);

                    return true;
                }
            ),
            { numRuns: 10 }
        );
    });

    /**
     * Property: Rollback should support different rollback strategies
     */
    it('Property 30.4: Rollback should support different rollback strategies and reasons', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    environment: fc.constantFrom('staging', 'production'),
                    rollbackStrategy: fc.constantFrom('immediate', 'gradual', 'blue_green'),
                    rollbackReason: fc.constantFrom(
                        'performance_degradation',
                        'security_vulnerability', 
                        'critical_bug',
                        'user_complaints',
                        'monitoring_alerts',
                        'manual_decision'
                    ),
                    affectedComponents: fc.array(
                        fc.constantFrom('registry', 'payments', 'scheduler', 'frontend', 'api'),
                        { minLength: 1, maxLength: 3 }
                    )
                }),
                async (strategyData) => {
                    const environment = strategyData.environment;
                    
                    // Create successful deployment to rollback from
                    const currentDeployment: DeploymentRecord = {
                        id: `deploy_current_${Date.now()}`,
                        timestamp: Date.now() - 600000, // 10 minutes ago
                        version: 'v2.0.0',
                        environment,
                        status: 'success',
                        duration: 300000,
                        artifacts: strategyData.affectedComponents.map(component => ({
                            type: 'program' as const,
                            name: `synapsepay-${component}`,
                            path: `/deployments/v2.0.0/${component}.so`,
                            hash: `hash_${component}`,
                            size: 1024 * 1024
                        })),
                        tests: []
                    };

                    const previousDeployment: DeploymentRecord = {
                        id: `deploy_previous_${Date.now()}`,
                        timestamp: Date.now() - 1200000, // 20 minutes ago
                        version: 'v1.9.0',
                        environment,
                        status: 'success',
                        duration: 300000,
                        artifacts: strategyData.affectedComponents.map(component => ({
                            type: 'program' as const,
                            name: `synapsepay-${component}`,
                            path: `/deployments/v1.9.0/${component}.so`,
                            hash: `hash_prev_${component}`,
                            size: 1024 * 1024
                        })),
                        tests: []
                    };

                    // Set up deployment history
                    deploymentSystem['deploymentHistory'].push(previousDeployment);
                    deploymentSystem['deploymentHistory'].push(currentDeployment);
                    
                    const env = deploymentSystem.getEnvironment(environment)!;
                    env.lastDeployment = currentDeployment;

                    // Perform rollback with specific strategy and reason
                    const rollbackResult = await deploymentSystem.rollbackDeployment(
                        environment,
                        strategyData.rollbackReason,
                        {
                            strategy: strategyData.rollbackStrategy,
                            affectedComponents: strategyData.affectedComponents
                        }
                    );

                    // Verify rollback was successful
                    expect(rollbackResult).toBeDefined();
                    expect(rollbackResult.success).toBe(true);
                    expect(rollbackResult.rollbackReason).toBe(strategyData.rollbackReason);

                    // Verify rollback info includes strategy details
                    const updatedEnv = deploymentSystem.getEnvironment(environment)!;
                    expect(updatedEnv.lastDeployment).toBeDefined();
                    expect(updatedEnv.lastDeployment!.rollbackInfo).toBeDefined();
                    
                    const rollbackInfo = updatedEnv.lastDeployment!.rollbackInfo!;
                    expect(rollbackInfo.rollbackReason).toBe(strategyData.rollbackReason);
                    expect(rollbackInfo.affectedComponents).toEqual(strategyData.affectedComponents);
                    expect(rollbackInfo.previousVersion).toBe('v1.9.0');

                    // Verify rollback timestamp is recent
                    expect(rollbackInfo.rollbackTimestamp).toBeGreaterThan(Date.now() - 10000);

                    return true;
                }
            ),
            { numRuns: 8 }
        );
    });

    /**
     * Property: Rollback should validate rollback target before execution
     */
    it('Property 30.5: Rollback should validate rollback target and prevent invalid rollbacks', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    environment: fc.constantFrom('staging', 'production'),
                    targetVersion: fc.oneof(
                        fc.constant('v1.0.0'), // Valid version
                        fc.constant('v999.999.999'), // Invalid version
                        fc.constant('invalid-version'), // Malformed version
                        fc.constant('') // Empty version
                    ),
                    rollbackReason: fc.constantFrom('validation_test', 'manual_rollback')
                }),
                async (validationData) => {
                    const environment = validationData.environment;
                    
                    // Create deployment history with known versions
                    const knownDeployments = [
                        {
                            id: `deploy_v1_${Date.now()}`,
                            timestamp: Date.now() - 1800000, // 30 minutes ago
                            version: 'v1.0.0',
                            environment,
                            status: 'success' as const,
                            duration: 300000,
                            artifacts: [],
                            tests: []
                        },
                        {
                            id: `deploy_v2_${Date.now()}`,
                            timestamp: Date.now() - 600000, // 10 minutes ago
                            version: 'v2.0.0',
                            environment,
                            status: 'success' as const,
                            duration: 300000,
                            artifacts: [],
                            tests: []
                        }
                    ];

                    knownDeployments.forEach(d => deploymentSystem['deploymentHistory'].push(d));
                    
                    const env = deploymentSystem.getEnvironment(environment)!;
                    env.lastDeployment = knownDeployments[1]; // Currently on v2.0.0

                    // Attempt rollback to target version
                    try {
                        const rollbackResult = await deploymentSystem.rollbackDeployment(
                            environment,
                            validationData.rollbackReason,
                            { targetVersion: validationData.targetVersion }
                        );

                        if (validationData.targetVersion === 'v1.0.0') {
                            // Valid rollback should succeed
                            expect(rollbackResult.success).toBe(true);
                            expect(rollbackResult.rolledBackTo).toBe('v1.0.0');
                        } else {
                            // Invalid rollbacks should fail gracefully
                            expect(rollbackResult.success).toBe(false);
                            expect(rollbackResult.error).toBeDefined();
                            expect(rollbackResult.error).toContain('version');
                        }
                    } catch (error) {
                        // Invalid rollbacks may throw errors
                        if (validationData.targetVersion !== 'v1.0.0') {
                            expect(error).toBeDefined();
                            expect(error.message).toBeDefined();
                        } else {
                            // Valid rollback should not throw
                            throw error;
                        }
                    }

                    // Environment should remain in consistent state
                    const finalEnv = deploymentSystem.getEnvironment(environment)!;
                    expect(finalEnv).toBeDefined();
                    expect(['active', 'failed']).toContain(finalEnv.status);

                    return true;
                }
            ),
            { numRuns: 12 }
        );
    });

    /**
     * Property: Rollback should handle concurrent rollback requests safely
     */
    it('Property 30.6: Rollback should handle concurrent rollback requests without corruption', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    environment: fc.constantFrom('staging', 'production'),
                    concurrentRequests: fc.integer({ min: 2, max: 4 }),
                    rollbackReason: fc.constantFrom('concurrent_test', 'stress_test')
                }),
                async (concurrencyData) => {
                    const environment = concurrencyData.environment;
                    
                    // Set up deployment history
                    const deployments = [
                        {
                            id: `deploy_v1_${Date.now()}`,
                            timestamp: Date.now() - 1800000,
                            version: 'v1.0.0',
                            environment,
                            status: 'success' as const,
                            duration: 300000,
                            artifacts: [],
                            tests: []
                        },
                        {
                            id: `deploy_v2_${Date.now()}`,
                            timestamp: Date.now() - 600000,
                            version: 'v2.0.0',
                            environment,
                            status: 'failed' as const,
                            duration: 180000,
                            artifacts: [],
                            tests: []
                        }
                    ];

                    deployments.forEach(d => deploymentSystem['deploymentHistory'].push(d));
                    
                    const env = deploymentSystem.getEnvironment(environment)!;
                    env.lastDeployment = deployments[1];
                    env.status = 'failed';

                    // Trigger concurrent rollback requests
                    const rollbackPromises = Array.from({ length: concurrencyData.concurrentRequests }, (_, i) =>
                        deploymentSystem.rollbackDeployment(
                            environment,
                            `${concurrencyData.rollbackReason}_${i}`
                        )
                    );

                    const rollbackResults = await Promise.all(rollbackPromises);

                    // Verify all requests were handled
                    expect(rollbackResults).toHaveLength(concurrencyData.concurrentRequests);

                    // At least one rollback should succeed
                    const successfulRollbacks = rollbackResults.filter(r => r.success);
                    expect(successfulRollbacks.length).toBeGreaterThan(0);

                    // Environment should be in consistent final state
                    const finalEnv = deploymentSystem.getEnvironment(environment)!;
                    expect(finalEnv).toBeDefined();
                    expect(['active', 'failed']).toContain(finalEnv.status);

                    // If any rollback succeeded, environment should be active
                    if (successfulRollbacks.length > 0) {
                        expect(finalEnv.status).toBe('active');
                        expect(finalEnv.lastDeployment).toBeDefined();
                        expect(finalEnv.lastDeployment!.rollbackInfo).toBeDefined();
                    }

                    return true;
                }
            ),
            { numRuns: 5 }
        );
    });
});