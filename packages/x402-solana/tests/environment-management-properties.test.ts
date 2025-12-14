/**
 * Property-Based Tests for Environment Management
 * **Feature: synapsepay-enhancements, Property 27: إدارة البيئات المتعددة**
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import fc from 'fast-check';
import { 
    EnvironmentManager,
    Environment,
    EnvironmentConfig,
    DeploymentRecord,
    AutomatedTestPipeline,
    CICDPipeline,
    TestStage,
    CICDStage
} from '../src/deployment-system';

describe('Environment Management Properties', () => {
    let envManager: EnvironmentManager;

    beforeEach(() => {
        envManager = new EnvironmentManager();
        // Clear any test environments to avoid conflicts with default environments
        const testEnvs = envManager.listEnvironments().filter(env => 
            !['development', 'staging', 'production'].includes(env.name)
        );
        testEnvs.forEach(env => {
            // Reset to inactive to avoid conflicts
            if (env.status === 'active') {
                envManager.switchEnvironment(env.name, 'development');
            }
        });
    });

    /**
     * **Feature: synapsepay-enhancements, Property 27: إدارة البيئات المتعددة**
     * Property: For any environment configuration, switching between environments should preserve correct settings
     */
    it('Property 27.1: Environment switching should preserve correct configurations', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 3, maxLength: 20 })
                        .filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(s.trim()))
                        .map(s => s.trim())
                        .filter(s => !['development', 'staging', 'production'].includes(s)),
                    type: fc.constantFrom('development', 'staging', 'production', 'testnet', 'mainnet'),
                    solanaNetwork: fc.constantFrom('localnet', 'devnet', 'testnet', 'mainnet-beta'),
                    rpcUrl: fc.constantFrom(
                        'http://localhost:8899',
                        'https://api.devnet.solana.com',
                        'https://api.testnet.solana.com',
                        'https://api.mainnet-beta.solana.com'
                    ),
                    wsUrl: fc.constantFrom(
                        'ws://localhost:8900',
                        'wss://api.devnet.solana.com',
                        'wss://api.testnet.solana.com',
                        'wss://api.mainnet-beta.solana.com'
                    )
                }),
                (envData) => {
                    const config: EnvironmentConfig = {
                        solanaNetwork: envData.solanaNetwork,
                        rpcUrl: envData.rpcUrl,
                        wsUrl: envData.wsUrl,
                        programIds: {
                            registry: `${envData.name.toUpperCase()}_REGISTRY_PROGRAM_ID`,
                            payments: `${envData.name.toUpperCase()}_PAYMENTS_PROGRAM_ID`,
                            scheduler: `${envData.name.toUpperCase()}_SCHEDULER_PROGRAM_ID`
                        },
                        features: {
                            gasless: true,
                            robotControl: true,
                            iotDevice: true,
                            monitoring: true
                        },
                        security: {
                            rateLimiting: envData.type === 'production',
                            emergencyPause: true,
                            multiSig: envData.type !== 'development'
                        },
                        resources: {
                            maxConcurrentUsers: envData.type === 'production' ? 10000 : 100,
                            maxTransactionsPerSecond: envData.type === 'production' ? 5000 : 500,
                            storageLimit: 1024 * 1024 * 100
                        }
                    };

                    const environment: Environment = {
                        name: envData.name,
                        type: envData.type as any,
                        config,
                        status: 'inactive'
                    };

                    // Create environment
                    const created = envManager.createEnvironment(environment);
                    expect(created).toBe(true);

                    // Retrieve and verify configuration
                    const retrieved = envManager.getEnvironment(envData.name);
                    expect(retrieved).toBeDefined();
                    expect(retrieved!.config.solanaNetwork).toBe(envData.solanaNetwork);
                    expect(retrieved!.config.rpcUrl).toBe(envData.rpcUrl);
                    expect(retrieved!.config.wsUrl).toBe(envData.wsUrl);
                    expect(retrieved!.type).toBe(envData.type);

                    // Verify security settings match environment type
                    if (envData.type === 'production') {
                        expect(retrieved!.config.security.rateLimiting).toBe(true);
                        expect(retrieved!.config.security.multiSig).toBe(true);
                    } else if (envData.type === 'development') {
                        expect(retrieved!.config.security.multiSig).toBe(false);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Environment configuration validation should catch invalid configurations
     */
    it('Property 27.2: Environment validation should reject invalid configurations', () => {
        fc.assert(
            fc.property(
                fc.record({
                    solanaNetwork: fc.string(),
                    rpcUrl: fc.string(),
                    wsUrl: fc.string(),
                    maxConcurrentUsers: fc.integer(),
                    maxTransactionsPerSecond: fc.integer(),
                    storageLimit: fc.integer()
                }),
                (invalidData) => {
                    const config: EnvironmentConfig = {
                        solanaNetwork: invalidData.solanaNetwork,
                        rpcUrl: invalidData.rpcUrl,
                        wsUrl: invalidData.wsUrl,
                        programIds: {
                            registry: 'INVALID_ID',
                            payments: 'INVALID_ID',
                            scheduler: 'INVALID_ID'
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
                            maxConcurrentUsers: invalidData.maxConcurrentUsers,
                            maxTransactionsPerSecond: invalidData.maxTransactionsPerSecond,
                            storageLimit: invalidData.storageLimit
                        }
                    };

                    const validation = envManager.validateEnvironmentConfig(config);
                    
                    // Should have validation errors for invalid data
                    const validNetworks = ['localnet', 'devnet', 'testnet', 'mainnet-beta'];
                    const hasInvalidNetwork = !validNetworks.includes(invalidData.solanaNetwork);
                    const hasInvalidUrl = !invalidData.rpcUrl.startsWith('http') || !invalidData.wsUrl.startsWith('ws');
                    const hasInvalidResources = invalidData.maxConcurrentUsers <= 0 || 
                                             invalidData.maxTransactionsPerSecond <= 0 || 
                                             invalidData.storageLimit <= 0;

                    if (hasInvalidNetwork || hasInvalidUrl || hasInvalidResources) {
                        expect(validation.valid).toBe(false);
                        expect(validation.errors.length).toBeGreaterThan(0);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Environment switching should maintain consistency
     */
    it('Property 27.3: Environment switching should maintain state consistency', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 3, maxLength: 10 })
                        .filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(s.trim()))
                        .map(s => s.trim())
                        .filter(s => !['development', 'staging', 'production'].includes(s)),
                    { minLength: 2, maxLength: 5 }
                ),
                (envNames) => {
                    // Create multiple environments
                    const environments = envNames.map(name => ({
                        name,
                        type: 'development' as const,
                        config: {
                            solanaNetwork: 'devnet',
                            rpcUrl: 'https://api.devnet.solana.com',
                            wsUrl: 'wss://api.devnet.solana.com',
                            programIds: {
                                registry: `${name}_REGISTRY`,
                                payments: `${name}_PAYMENTS`,
                                scheduler: `${name}_SCHEDULER`
                            },
                            features: {
                                gasless: true,
                                robotControl: true,
                                iotDevice: true,
                                monitoring: true
                            },
                            security: {
                                rateLimiting: false,
                                emergencyPause: true,
                                multiSig: false
                            },
                            resources: {
                                maxConcurrentUsers: 100,
                                maxTransactionsPerSecond: 500,
                                storageLimit: 1024 * 1024
                            }
                        },
                        status: 'inactive' as const
                    }));

                    // Create all environments
                    environments.forEach(env => {
                        envManager.createEnvironment(env);
                    });

                    // Test switching between environments
                    for (let i = 0; i < envNames.length - 1; i++) {
                        const fromEnv = envNames[i];
                        const toEnv = envNames[i + 1];

                        // Switch environment
                        const switched = envManager.switchEnvironment(fromEnv, toEnv);
                        expect(switched).toBe(true);

                        // Verify states
                        const fromStatus = envManager.getEnvironmentStatus(fromEnv);
                        const toStatus = envManager.getEnvironmentStatus(toEnv);
                        
                        expect(fromStatus).toBe('inactive');
                        expect(toStatus).toBe('active');

                        // Verify the target environment is active
                        const activeEnvs = envManager.getActiveEnvironments();
                        const targetEnvActive = activeEnvs.find(env => env.name === toEnv);
                        expect(targetEnvActive).toBeDefined();
                        expect(targetEnvActive!.name).toBe(toEnv);
                    }

                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Property: Environment configuration export/import should be consistent
     */
    it('Property 27.4: Environment export/import should preserve configuration', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 3, maxLength: 15 })
                        .filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(s.trim()))
                        .map(s => s.trim())
                        .filter(s => !['development', 'staging', 'production'].includes(s)),
                    solanaNetwork: fc.constantFrom('devnet', 'testnet', 'mainnet-beta'),
                    maxUsers: fc.integer({ min: 1, max: 10000 }),
                    maxTps: fc.integer({ min: 1, max: 5000 }),
                    storageLimit: fc.integer({ min: 1024, max: 1024 * 1024 * 1024 }),
                    gaslessEnabled: fc.boolean(),
                    rateLimitingEnabled: fc.boolean()
                }),
                (envData) => {
                    const config: EnvironmentConfig = {
                        solanaNetwork: envData.solanaNetwork,
                        rpcUrl: `https://api.${envData.solanaNetwork}.solana.com`,
                        wsUrl: `wss://api.${envData.solanaNetwork}.solana.com`,
                        programIds: {
                            registry: `${envData.name}_REGISTRY_ID`,
                            payments: `${envData.name}_PAYMENTS_ID`,
                            scheduler: `${envData.name}_SCHEDULER_ID`
                        },
                        features: {
                            gasless: envData.gaslessEnabled,
                            robotControl: true,
                            iotDevice: true,
                            monitoring: true
                        },
                        security: {
                            rateLimiting: envData.rateLimitingEnabled,
                            emergencyPause: true,
                            multiSig: true
                        },
                        resources: {
                            maxConcurrentUsers: envData.maxUsers,
                            maxTransactionsPerSecond: envData.maxTps,
                            storageLimit: envData.storageLimit
                        }
                    };

                    const environment: Environment = {
                        name: envData.name,
                        type: 'staging',
                        config,
                        status: 'inactive'
                    };

                    // Create environment
                    envManager.createEnvironment(environment);

                    // Export configuration
                    const exportedConfig = envManager.exportEnvironmentConfig(envData.name);
                    expect(exportedConfig).toBeDefined();

                    // Import configuration to new environment
                    const newEnvName = `${envData.name}_imported`;
                    const newEnv: Environment = {
                        name: newEnvName,
                        type: 'development',
                        config: {
                            solanaNetwork: 'localnet',
                            rpcUrl: 'http://localhost:8899',
                            wsUrl: 'ws://localhost:8900',
                            programIds: { registry: '', payments: '', scheduler: '' },
                            features: { gasless: false, robotControl: false, iotDevice: false, monitoring: false },
                            security: { rateLimiting: false, emergencyPause: false, multiSig: false },
                            resources: { maxConcurrentUsers: 1, maxTransactionsPerSecond: 1, storageLimit: 1024 }
                        },
                        status: 'inactive'
                    };

                    envManager.createEnvironment(newEnv);
                    const imported = envManager.importEnvironmentConfig(newEnvName, exportedConfig!);
                    expect(imported).toBe(true);

                    // Verify imported configuration matches original
                    const importedEnv = envManager.getEnvironment(newEnvName);
                    expect(importedEnv).toBeDefined();
                    expect(importedEnv!.config.solanaNetwork).toBe(envData.solanaNetwork);
                    expect(importedEnv!.config.features.gasless).toBe(envData.gaslessEnabled);
                    expect(importedEnv!.config.security.rateLimiting).toBe(envData.rateLimitingEnabled);
                    expect(importedEnv!.config.resources.maxConcurrentUsers).toBe(envData.maxUsers);
                    expect(importedEnv!.config.resources.maxTransactionsPerSecond).toBe(envData.maxTps);
                    expect(importedEnv!.config.resources.storageLimit).toBe(envData.storageLimit);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Environment health checks should accurately reflect status
     */
    it('Property 27.5: Environment health checks should reflect actual status', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 3, maxLength: 10 })
                            .filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(s.trim()))
                            .map(s => s.trim())
                            .filter(s => !['development', 'staging', 'production'].includes(s)),
                        status: fc.constantFrom('active', 'inactive', 'deploying', 'failed'),
                        hasSuccessfulDeployment: fc.boolean()
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (envDataArray) => {
                    // Create environments with different statuses
                    envDataArray.forEach(envData => {
                        const environment: Environment = {
                            name: envData.name,
                            type: 'development',
                            config: {
                                solanaNetwork: 'devnet',
                                rpcUrl: 'https://api.devnet.solana.com',
                                wsUrl: 'wss://api.devnet.solana.com',
                                programIds: {
                                    registry: `${envData.name}_REGISTRY`,
                                    payments: `${envData.name}_PAYMENTS`,
                                    scheduler: `${envData.name}_SCHEDULER`
                                },
                                features: {
                                    gasless: true,
                                    robotControl: true,
                                    iotDevice: true,
                                    monitoring: true
                                },
                                security: {
                                    rateLimiting: false,
                                    emergencyPause: true,
                                    multiSig: false
                                },
                                resources: {
                                    maxConcurrentUsers: 100,
                                    maxTransactionsPerSecond: 500,
                                    storageLimit: 1024 * 1024
                                }
                            },
                            status: envData.status as any
                        };

                        if (envData.hasSuccessfulDeployment) {
                            environment.lastDeployment = {
                                id: `deploy_${envData.name}`,
                                timestamp: Date.now(),
                                version: 'v1.0.0',
                                environment: envData.name,
                                status: 'success',
                                artifacts: [],
                                tests: []
                            };
                        }

                        envManager.createEnvironment(environment);
                    });

                    // Verify health checks
                    envDataArray.forEach(envData => {
                        const isHealthy = envManager.isEnvironmentHealthy(envData.name);
                        const expectedHealthy = envData.status === 'active' && envData.hasSuccessfulDeployment;
                        
                        expect(isHealthy).toBe(expectedHealthy);
                        
                        const status = envManager.getEnvironmentStatus(envData.name);
                        expect(status).toBe(envData.status);
                    });

                    // Verify active environments include expected ones (accounting for default environments)
                    const activeEnvs = envManager.getActiveEnvironments();
                    const expectedActiveEnvs = envDataArray.filter(env => env.status === 'active');
                    expectedActiveEnvs.forEach(expectedEnv => {
                        const found = activeEnvs.find(env => env.name === expectedEnv.name);
                        expect(found).toBeDefined();
                        expect(found!.status).toBe('active');
                    });

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property: Environment listing should return all created environments
     */
    it('Property 27.6: Environment listing should include all created environments', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 3, maxLength: 15 })
                        .filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(s.trim()))
                        .map(s => s.trim())
                        .filter(s => !['development', 'staging', 'production'].includes(s)),
                    { minLength: 1, maxLength: 10 }
                ),
                (envNames) => {
                    const uniqueNames = [...new Set(envNames)]; // Remove duplicates
                    
                    // Create environments
                    uniqueNames.forEach(name => {
                        const environment: Environment = {
                            name,
                            type: 'development',
                            config: {
                                solanaNetwork: 'devnet',
                                rpcUrl: 'https://api.devnet.solana.com',
                                wsUrl: 'wss://api.devnet.solana.com',
                                programIds: {
                                    registry: `${name}_REGISTRY`,
                                    payments: `${name}_PAYMENTS`,
                                    scheduler: `${name}_SCHEDULER`
                                },
                                features: {
                                    gasless: true,
                                    robotControl: true,
                                    iotDevice: true,
                                    monitoring: true
                                },
                                security: {
                                    rateLimiting: false,
                                    emergencyPause: true,
                                    multiSig: false
                                },
                                resources: {
                                    maxConcurrentUsers: 100,
                                    maxTransactionsPerSecond: 500,
                                    storageLimit: 1024 * 1024
                                }
                            },
                            status: 'inactive'
                        };

                        const created = envManager.createEnvironment(environment);
                        expect(created).toBe(true);
                    });

                    // List all environments
                    const allEnvironments = envManager.listEnvironments();
                    
                    // Should include default environments (development, staging, production) plus created ones
                    const defaultEnvCount = 3;
                    const totalExpected = defaultEnvCount + uniqueNames.length;
                    expect(allEnvironments.length).toBe(totalExpected);

                    // Verify all created environments are in the list
                    uniqueNames.forEach(name => {
                        const found = allEnvironments.find(env => env.name === name);
                        expect(found).toBeDefined();
                        expect(found!.name).toBe(name);
                    });

                    return true;
                }
            ),
            { numRuns: 25 }
        );
    });

    /**
     * Property: Duplicate environment creation should be rejected
     */
    it('Property 27.7: Duplicate environment names should be rejected', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 })
                    .filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9_-]+$/.test(s.trim()))
                    .map(s => s.trim())
                    .filter(s => !['development', 'staging', 'production'].includes(s)),
                (envName) => {
                    const environment: Environment = {
                        name: envName,
                        type: 'development',
                        config: {
                            solanaNetwork: 'devnet',
                            rpcUrl: 'https://api.devnet.solana.com',
                            wsUrl: 'wss://api.devnet.solana.com',
                            programIds: {
                                registry: `${envName}_REGISTRY`,
                                payments: `${envName}_PAYMENTS`,
                                scheduler: `${envName}_SCHEDULER`
                            },
                            features: {
                                gasless: true,
                                robotControl: true,
                                iotDevice: true,
                                monitoring: true
                            },
                            security: {
                                rateLimiting: false,
                                emergencyPause: true,
                                multiSig: false
                            },
                            resources: {
                                maxConcurrentUsers: 100,
                                maxTransactionsPerSecond: 500,
                                storageLimit: 1024 * 1024
                            }
                        },
                        status: 'inactive'
                    };

                    // First creation should succeed
                    const firstCreation = envManager.createEnvironment(environment);
                    expect(firstCreation).toBe(true);

                    // Second creation with same name should fail
                    const secondCreation = envManager.createEnvironment(environment);
                    expect(secondCreation).toBe(false);

                    // Environment should still exist and be retrievable
                    const retrieved = envManager.getEnvironment(envName);
                    expect(retrieved).toBeDefined();
                    expect(retrieved!.name).toBe(envName);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});